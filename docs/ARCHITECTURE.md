# Architecture and Design

## System Overview

The Bedrock Redirect Mod consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                      Players                                 │
│                  (Xbox Accounts)                             │
└────────────────────┬────────────────────────────────────────┘
                     │ Xbox Messages
                     │
         ┌───────────▼──────────┐
         │   Xbox Live API      │
         │  (Authentication)    │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────────────────────┐
         │      Backend Service (Node.js)       │
         │  ┌──────────────────────────────┐   │
         │  │   Message Processing         │   │
         │  │   Invite Management         │   │
         │  │   Redirect Orchestration    │   │
         │  └──────────────────────────────┘   │
         └───────────┬─────────────────────────┘
                     │ Bedrock Protocol
         ┌───────────▼──────────────────────────┐
         │  Bedrock Dedicated Server            │
         │  ┌──────────────────────────────┐   │
         │  │   World (Redirect World)     │   │
         │  │   - Join Detection           │   │
         │  │   - Redirect Logic           │   │
         │  │   - Player Tracking          │   │
         │  └──────────────────────────────┘   │
         │  ┌──────────────────────────────┐   │
         │  │   Main Server Target         │   │
         │  │   (Optional fallback)        │   │
         │  └──────────────────────────────┘   │
         └──────────────────────────────────────┘
```

## Component Details

### 1. Backend Service (`/backend`)

**Role:** Orchestrates the entire redirect flow

**Key Classes:**
- `XboxManager` - Handles Xbox Live API communication
- `RedirectManager` - Manages player redirects
- `Express Server` - Provides REST API for all operations

**Responsibilities:**
- Authenticate with Xbox Live
- Poll for new Xbox messages
- Detect trigger keywords
- Send game invites to players
- Track pending redirects
- Process player join events

**API Endpoints:**
```
POST   /api/message           - New Xbox message
POST   /api/player/join       - Player joined world
GET    /api/pending-invites   - Pending redirects (debug)
GET    /health                - Health check
```

### 2. Behavior Pack (`/behavior_pack`)

**Role:** Runs in Bedrock world to detect and process redirects

**Components:**
- `manifest.json` - Pack metadata and module declarations
- `scripts/main.js` - Event handlers and redirect logic
- `functions/redirect.mcfunction` - Chat commands
- `config.json` - Redirect configuration

**Key Functions:**
- `onPlayerSpawn()` - Detects player joins
- `notifyPlayerJoin()` - Reports to backend API
- `redirectPlayer()` - Executes redirect sequence
- `scheduleRedirect()` - Timing management

**Bedrock Scripting API Used:**
- `@minecraft/server` - Player events, world access
- `system.runTimeout()` - Delayed execution
- `player.runCommand()` - Execute Bedrock commands

### 3. Data Flow

#### Full Request Lifecycle

```
1. Player Message
   └─ Player sends Xbox message to alt account
   └─ Message: "hey can I get an invite?"

2. Message Detection
   └─ Xbox Manager polls messages
   └─ Detects keyword: "invite"
   └─ Identifies player gamertag

3. Invite Trigger
   └─ Backend calls XboxManager.sendInvite(gamertag)
   └─ Sends game invite via Xbox Live API
   └─ Stores invite in pendingInvites map

4. Player Join
   └─ Player receives invite and joins world
   └─ Bedrock detects player spawn event
   └─ Behavior pack onPlayerSpawn() triggered

5. Notification
   └─ Behavior pack calls backend /api/player/join
   └─ Backend verifies player has pending invite
   └─ Backend returns redirect server IP:PORT

6. Redirect Execution
   └─ Behavior pack schedules redirectPlayer()
   └─ Sends chat message with server info
   └─ Executes redirect titleraw command
   └─ Player client receives server connection info

7. Cleanup
   └─ Backend removes from pendingInvites
   └─ Behavior pack removes from local tracking
```

## State Management

### Backend State

```javascript
// In-memory storage of pending invites
pendingInvites = Map<gamertag, {
  timestamp: number,
  redirectServer: string
}>

// Example:
{
  "PlayerName_123": {
    timestamp: 1708622400000,
    redirectServer: "your.server.com:19132"
  }
}
```

### World State

```javascript
// Behavior pack tracking
playersToRedirect = Map<gamertag, {
  server: string,
  timestamp: number
}>
```

## Timing and Synchronization

### Expected Timings

| Event | Duration | Notes |
|-------|----------|-------|
| Message Detection | 10s (polling) | Xbox API poll interval |
| Invite Send | <1s | Xbox Live API response |
| Player Join | <30s | Player acceptance time |
| Join Detection | <1s | Bedrock event listener |
| Redirect Execution | 1-2s | Bedrock command execution |
| **Total Flow** | **~43s average** | From message to final redirect |

### Synchronization Points

1. **Message → Invite Dispatch**
   - Poll interval: 10 seconds
   - No blocking - asynchronous

2. **Player Join → Backend Notification**
   - Bedrock event → REST API call
   - Fetch with 5s timeout

3. **Backend → Redirect Execution**
   - API response → scheduleRedirect() in Bedrock
   - 20 ticks (1 second) delay for player load

## Error Handling

### Backend Errors

```
Message Processing Error
  └─ Invalid JSON → Return 400
  └─ Missing fields → Return 400
  └─ Xbox API error → Return 500
  └─ Invite send failed → Return 500

Player Join Error
  └─ No pending invite → Return success, no action
  └─ Player not found → Log error, continue
  └─ Backend unreachable → Local fallback in world
```

### Bedrock Errors

```
Player Spawn Error
  └─ Fetch fails → Fallback to local player tracking
  └─ Backend offline → Store in local queue
  └─ Command execution fails → Try alternative commands

Redirect Error
  └─ Player left world → Clean up tracking
  └─ Invalid server IP → Show error message
  └─ Timeout → Retry logic (configurable)
```

## Security Considerations

### Authentication
- Xbox Live API uses OAuth 2.0
- Credentials stored in `.env` (not in version control)
- Tokens refreshed automatically

### Input Validation
- Gamertag: Alphanumeric only
- Server IP: Valid IP format validation
- Message: Filter for trigger keywords only

### Rate Limiting
- Message processing: 1 per player per 10 seconds
- Invite sending: 1 per player per 5 minutes
- Redirect execution: 1 per player per session

## Performance Characteristics

### Scalability

| Metric | Capacity | Notes |
|--------|----------|-------|
| Concurrent Redirects | 100+ | Limited by Map size |
| Message Processing | 1000/min | Xbox API polling |
| Player Tracking | Unlimited | Ephemeral data |
| Backend Memory | ~10MB baseline | Growing with active sessions |

### Optimization Opportunities

1. **Caching**
   - Cache player UUIDs by gamertag
   - Store redirect history

2. **Batching**
   - Batch redirect commands
   - Queue invite sends during off-peak

3. **Database**
   - Migrate from in-memory to Redis
   - Persistent invite history

## Deployment Architecture

### Development
```
localhost:3000 (Backend)
    ↓
localhost:19132 (Bedrock Server)
    ↓
localhost:19133 (RCON)
```

### Production
```
backend.yourserver.com (Backend API)
    ↓
bedrock.yourserver.com (Bedrock Dedicated Server)
    ↓
redirect-target.com (Main Server)
```

## Extension Points

The system is designed for extensibility:

1. **Message Sources**
   - Discord bots → POST /api/message
   - In-game commands → POST /api/message
   - Web forms → POST /api/message

2. **Action Types**
   - Custom invites beyond game
   - Economy integration
   - Role-based auto-invites

3. **Redirect Targets**
   - Multiple servers by player tier
   - Dynamic server selection
   - Fallback routing

