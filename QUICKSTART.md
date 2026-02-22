# Quick Reference Guide

## Start the System

### 1. Terminal 1 - Start Backend
```bash
cd /workspaces/redirect-mod/backend
npm install  # First time only
npm start
```

Expected output:
```
🎮 Bedrock Redirect Bot listening on port 3000
📡 Redirect Server: your.server.com:19132
```

### 2. Terminal 2 - Test the System
```bash
# Test health endpoint
curl http://localhost:3000/health

# Simulate player sending invite message
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"gamertag": "TestPlayer", "message": "can I get an invite?"}'

# Check pending redirects
curl http://localhost:3000/api/pending-invites
```

### 3. In Bedrock World
- Load world with behavior pack enabled
- Join as a player
- System will auto-detect your join
- Should see redirect logs

## File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Backend Server | `/backend/index.js` | Main API server |
| Xbox Manager | `/backend/xbox-manager.js` | Xbox Live integration |
| Redirect Logic | `/backend/redirect-manager.js` | Server redirect |
| Behavior Pack | `/behavior_pack/manifest.json` | Bedrock world scripts |
| Redirect Script | `/behavior_pack/scripts/main.js` | Player event handlers |
| Config | `/backend/.env` | Credentials & settings |
| Docs | `/docs/` | Full documentation |

## Environment Variables (.env)

```env
# Alt Account (for sending invites)
XBOX_EMAIL=your-alt@xbox.com
XBOX_PASSWORD=your-password

# Bedrock Server
BEDROCK_SERVER_IP=127.0.0.1
BEDROCK_SERVER_PORT=19132
BEDROCK_RCON_PORT=19133
BEDROCK_RCON_PASSWORD=your-rcon-password

# Target Server (where to redirect players)
REDIRECT_SERVER_IP=your.main.server.com
REDIRECT_SERVER_PORT=19132

# Backend
BACKEND_PORT=3000
```

## How It Works (Simplified)

1. **Player Messages** → Sends Xbox message to alt account
2. **Backend Detects** → Sees "invite" keyword
3. **Backend Responds** → Sends game invite
4. **Player Joins** → Joins the redirect world
5. **Script Detects** → Behavior pack sees player join
6. **Backend Notified** → Sends player info to backend API
7. **Redirect Sent** → Backend tells player: go to main server
8. **Player Connects** → Joins main server

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Health endpoint responds: `curl http://localhost:3000/health`
- [ ] Can post message: `curl http://localhost:3000/api/message -X POST ...`
- [ ] Pending invites show up: `curl http://localhost:3000/api/pending-invites`
- [ ] Behavior pack loads in world (check world settings)
- [ ] Player join event triggers script (check console)
- [ ] Redirect completes to target server

## Common Commands

```bash
# Kill backend if stuck
pkill -f "node index.js"

# View backend logs
tail -f backend/debug.log

# Monitor network traffic
netstat -an | grep 19132

# Check if port is in use
lsof -i :3000

# Restart everything
pkill node
sleep 2
cd backend && npm start
```

## Next: Xbox Integration

The system is mostly ready but needs Xbox Live API setup:

1. Get Xbox Application ID from Azure Portal
2. Implement authentication in `xbox-manager.js`
3. Set up message monitoring
4. Test with real Xbox messages

See `docs/XBOX_INTEGRATION.md` for detailed steps.

## Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| `Cannot find module` | Run `npm install` in backend/ |
| `EADDRINUSE 3000` | Port in use: `pkill -f "node"` |
| `undefined.env` | Copy `.env.example` to `.env` |
| No logs | Enable debug mode in backend/index.js |
| Bedrock pack won't load | Enable experimental gameplay in world |
| No redirects happening | Check backend console for errors |

## Support

- **Docs:** See `/docs/` for full guides
- **Backend Issues:** Check `/backend/index.js` console output
- **Bedrock Issues:** Check world behavior pack settings
- **Integration:** See `docs/XBOX_INTEGRATION.md`

---

**Ready to start?** Follow the "Start the System" section above!
