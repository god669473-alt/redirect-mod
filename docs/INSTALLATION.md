# Installation Guide

## Prerequisites

- Bedrock Dedicated Server (Windows or Docker)
- Node.js 16+ installed
- NPM package manager
- Bedrock world with scripting enabled

## Step-by-Step Installation

### Step 1: Clone/Download Project

```bash
git clone <your-repo-url> redirect-mod
cd redirect-mod
```

### Step 2: Setup Backend Service

```bash
cd backend
npm install
```

Create `.env` file from template:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
XBOX_EMAIL=your-alt-account@xbox.com
XBOX_PASSWORD=your-password
BEDROCK_SERVER_IP=127.0.0.1
REDIRECT_SERVER_IP=your.main.server.com
REDIRECT_SERVER_PORT=19132
BACKEND_PORT=3000
```

Test backend starts:
```bash
npm start
# Should show: 🎮 Bedrock Redirect Bot listening on port 3000
```

### Step 3: Install Behavior Pack

1. Locate your Bedrock server folder:
   ```
   C:\Users\<Username>\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState
   ```
   OR Docker path: `/bedrock_server/`

2. Copy behavior pack:
   ```bash
   cp -r behavior_pack "C:\path\to\bedrock_server\behavior_packs\redirect_mod"
   ```

3. Or manually copy the `behavior_pack` folder to your server's `behavior_packs/` directory

### Step 4: Configure Bedrock World

In your world folder edit `level.dat` or use world settings:

1. Enable scripting experiments:
   ```
   enableExperimentalGameplay: true
   ```

2. Update `world_behavior_pack.json`:
   ```json
   {
     "packs": [
       {
         "pack_id": "12345678-1234-1234-1234-123456789abc",
         "version": [1, 0, 0]
       }
     ]
   }
   ```

### Step 5: Update Configuration

Edit `behavior_pack/config.json`:
```json
{
  "server": {
    "redirectServerIP": "your-actual-ip",
    "redirectServerPort": 19132
  },
  "backend": {
    "url": "http://localhost:3000"
  }
}
```

### Step 6: Run Everything

**Terminal 1 - Backend Service:**
```bash
cd backend
npm start
```

**Terminal 2 - Start Bedrock Server:**
```bash
# Windows
bedrock_server.exe

# Docker
docker run -it -p 19132:19132/udp -e EULA=TRUE itzg/minecraft-bedrock-server
```

**Terminal 3 - Join World:**
- Join your Bedrock world
- See redirect system activate in logs

## Verification

1. Backend running on port 3000:
   ```bash
   curl http://localhost:3000/health
   # Returns: {"status":"ok","timestamp":"..."}
   ```

2. Check pending invites:
   ```bash
   curl http://localhost:3000/api/pending-invites
   ```

3. Console should show:
   ```
   ✅ Redirect System initialized
   📡 Redirect Server: your.server.com:19132
   ```

## Next: Integration

Now you need to implement the Xbox Live API integration:

1. **Register Xbox Application** - Get Xbox Live API credentials
2. **Implement Authentication** - Add to `xbox-manager.js`
3. **Setup Message Polling** - Monitor Xbox DMs
4. **Test Full Flow** - End-to-end testing

See `xbox-manager.js` for TODO comments on what to implement.

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version  # Should be 16+

# Check if port 3000 is in use
lsof -i :3000

# Check .env file exists
ls -la .env
```

### Behavior pack not loading
- Check manifest.json format_version: should be 2
- Verify UUID matches in world_behavior_pack.json
- Enable experimental gameplay in world

### Scripts not executing
- Check console for errors with `script-watchdog-enabled: false`
- Verify scripts module in manifest.json
- Check main.js syntax

### Redirect not working
- Ensure backend is running
- Check logs for player join events
- Verify network connectivity between processes

## Next Steps

1. ✅ Backend running
2. ✅ Behavior pack installed
3. ⏳ Implement Xbox Live API integration
4. ⏳ Test full player flow
5. ⏳ Deploy to production

See `/docs` for detailed integration guides.
