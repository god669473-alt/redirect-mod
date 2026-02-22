require('dotenv').config();
const express = require('express');
const axios = require('axios');
const XboxManager = require('./xbox-manager');
const RedirectManager = require('./redirect-manager');

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

app.use(express.json());

// Initialize managers
const xboxManager = new XboxManager();
const redirectManager = new RedirectManager();

// Active invitations tracking
const pendingInvites = new Map();

/**
 * Endpoint: Monitor for incoming Xbox messages
 * Expected POST /api/message with { gamertag, message }
 */
app.post('/api/message', async (req, res) => {
  try {
    const { gamertag, message } = req.body;

    if (!gamertag || !message) {
      return res.status(400).json({ error: 'Missing gamertag or message' });
    }

    console.log(`\n📨 Message received from ${gamertag}: "${message}"`);

    // Check if message contains trigger keywords
    if (isInviteTrigger(message)) {
      console.log(`✅ Invite trigger detected for ${gamertag}`);
      
      // Send Xbox invite
      const inviteResult = await xboxManager.sendInvite(gamertag);
      
      if (inviteResult.success) {
        pendingInvites.set(gamertag, {
          timestamp: Date.now(),
          redirectServer: `${process.env.REDIRECT_SERVER_IP}:${process.env.REDIRECT_SERVER_PORT}`
        });
        
        console.log(`✉️  Invite sent to ${gamertag}`);
        res.json({ 
          success: true, 
          message: `Invite sent to ${gamertag}`,
          redirectServer: `${process.env.REDIRECT_SERVER_IP}:${process.env.REDIRECT_SERVER_PORT}`
        });
      } else {
        res.status(500).json({ error: 'Failed to send invite' });
      }
    } else {
      res.json({ success: false, message: 'Message did not contain invite trigger' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Handle player join event
 * Expected POST /api/player/join with { gamertag, uuid }
 */
app.post('/api/player/join', async (req, res) => {
  try {
    const { gamertag, uuid } = req.body;

    if (!gamertag) {
      return res.status(400).json({ error: 'Missing gamertag' });
    }

    console.log(`\n👤 Player joined: ${gamertag}`);

    // Check if player has pending invite
    if (pendingInvites.has(gamertag)) {
      const inviteData = pendingInvites.get(gamertag);
      console.log(`🔀 Redirecting ${gamertag} to ${inviteData.redirectServer}`);
      
      // Send redirect command
      await redirectManager.redirectPlayer(gamertag, inviteData.redirectServer);
      pendingInvites.delete(gamertag);

      res.json({ 
        success: true, 
        message: `Redirecting ${gamertag} to server`,
        server: inviteData.redirectServer
      });
    } else {
      res.json({ success: false, message: 'No pending invite for this player' });
    }
  } catch (error) {
    console.error('Error handling player join:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending invites (for debugging)
 */
app.get('/api/pending-invites', (req, res) => {
  const invites = Array.from(pendingInvites.entries()).map(([gamertag, data]) => ({
    gamertag,
    ...data,
    ageMs: Date.now() - data.timestamp
  }));
  res.json(invites);
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Check if message contains invite trigger keywords
 */
function isInviteTrigger(message) {
  const triggers = [
    'invite',
    'join',
    'inv',
    'redirect',
    'connect',
    '!invite',
    '!join'
  ];
  
  return triggers.some(trigger => 
    message.toLowerCase().includes(trigger)
  );
}

// Start server
app.listen(PORT, () => {
  console.log(`🎮 Bedrock Redirect Bot listening on port ${PORT}`);
  console.log(`📡 Redirect Server: ${process.env.REDIRECT_SERVER_IP}:${process.env.REDIRECT_SERVER_PORT}`);
});
