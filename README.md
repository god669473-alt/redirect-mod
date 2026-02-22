# Bedrock Redirect Mod

A Bedrock Dedicated Server redirect mod that automatically invites players via Xbox messages and redirects them to your main server.

## Features

✅ **Auto-Invite System** - Automatically send game invites when players message your alt Xbox account
✅ **Xbox Message Trigger** - Listen for incoming Xbox messages to trigger invites
✅ **Automatic Redirect** - Seamlessly redirect players to your main server when they join
✅ **Player Tracking** - Track pending invites and redirect operations
✅ **Bedrock 1.26+ Support** - Works with latest Bedrock Dedicated Server

## Project Structure

```
redirect-mod/
├── backend/                 # Node.js backend service
│   ├── index.js            # Main server & API endpoints
│   ├── xbox-manager.js     # Xbox Live integration
│   ├── redirect-manager.js # Server redirect logic
│   ├── package.json        # Dependencies
│   └── .env.example        # Configuration template
├── behavior_pack/          # Bedrock behavior pack
│   ├── manifest.json       # Pack manifest
│   ├── scripts/
│   │   └── main.js        # Redirect system script
│   ├── functions/
│   │   └── redirect.mcfunction
│   └── config.json        # Behavior pack config
├── docs/                   # Documentation
│   ├── INSTALLATION.md    # Setup guide
│   ├── XBOX_INTEGRATION.md # Xbox API integration
│   └── ARCHITECTURE.md    # System design
└── README.md              # This file
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Behavior Pack Installation
1. Copy `behavior_pack/` to your Bedrock server's `behavior_packs/` folder
2. Enable the pack in your world settings
3. Enable experimental scripting in world

### Configuration
Edit `.env`:
```env
XBOX_EMAIL=your-alt@xbox.com
XBOX_PASSWORD=your-password
REDIRECT_SERVER_IP=your.main.server.com
REDIRECT_SERVER_PORT=19132
```

See [Installation Guide](docs/INSTALLATION.md) for detailed setup.

## How It Works

```
Player messages alt account with "invite"
        ↓
Backend detects message trigger
        ↓
Backend sends game invite
        ↓
Player joins redirect world
        ↓
Behavior pack detects join event
        ↓
Backend redirects to main server
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/message` | New Xbox message incoming |
| POST | `/api/player/join` | Player joined world event |
| GET | `/api/pending-invites` | Get pending redirects (debug) |
| GET | `/health` | Health check |

## Documentation

- **[Installation Guide](docs/INSTALLATION.md)** - Step-by-step setup
- **[Xbox Integration Guide](docs/XBOX_INTEGRATION.md)** - Xbox Live API setup
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design details

## Requirements

- Node.js 16+ (for backend)
- Bedrock Dedicated Server 1.26+
- Xbox account (for alt inviter account)
- Network connectivity between backend and Bedrock server

## Trigger Keywords

Players can message any of these to trigger an invite:
- `invite`
- `join`
- `inv`
- `redirect`
- `connect`
- `!invite`
- `!join`

Example message: *"hey can I get an invite?"*

## Testing

### Test Backend
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Test invite trigger
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"gamertag": "TestPlayer", "message": "can I join?"}'
```

### Expected Response
```json
{
  "success": true,
  "message": "Invite sent to TestPlayer",
  "redirectServer": "your.server.com:19132"
}
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start | Check Node.js version (16+) and .env file |
| Behavior pack not loading | Enable experimental gameplay in world |
| Players not redirecting | Check backend is running and logs |
| Xbox integration fails | See Xbox Integration Guide in docs/ |

## Next Steps

1. ✅ Install backend and behavior pack
2. ⏳ Implement Xbox Live API integration (see docs/XBOX_INTEGRATION.md)
3. ⏳ Test full player flow
4. ⏳ Deploy to production

## Security Notes

⚠️ **Important:**
- Never commit `.env` with real credentials
- Use environment variables in production
- Validate all API inputs
- Rate-limit message endpoints
- Use HTTPS in production
- Keep Xbox credentials secure

## License

See LICENSE file

## Support

- Check [Installation Guide](docs/INSTALLATION.md) for setup issues
- See [Architecture Guide](docs/ARCHITECTURE.md) for technical details
- Review [Xbox Integration Guide](docs/XBOX_INTEGRATION.md) for API help

---

**Status:** 🔧 In Development - Xbox Live API integration needed