# Xbox Live API Integration Guide

This guide explains how to implement Xbox Live API integration for the redirect mod.

## Overview

The redirect mod needs to:
1. Authenticate with Xbox Live API
2. Monitor incoming Xbox messages to the alt account
3. Send game invites when trigger messages are received
4. Track pending invites

## Xbox Live API Setup

### 1. Register Azure Application

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application for Xbox Live
3. Create a client secret
4. Note your Application ID and Secret

### 2. Implement Authentication

Update `backend/xbox-manager.js`:

```javascript
// Step 1: Get OAuth token from Xbox Live
async getAuthToken() {
  const response = await axios.post(
    'https://login.live.com/oauth20_token.srf',
    {
      client_id: process.env.XBOX_APP_ID,
      client_secret: process.env.XBOX_CLIENT_SECRET,
      scope: 'XboxLive.signin offline_access',
      grant_type: 'client_credentials'
    }
  );
  
  this.authToken = response.data.access_token;
  return this.authToken;
}

// Step 2: Get user token
async getUserToken() {
  const response = await axios.post(
    'https://user.auth.xboxlive.com/user/authenticate',
    {
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: process.env.XBOX_REFRESH_TOKEN
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    }
  );
  
  return response.data.Token;
}
```

### 3. Monitor Xbox Messages

Implement message polling in `xbox-manager.js`:

```javascript
async monitorMessages() {
  // Poll Xbox API for new messages every 10 seconds
  setInterval(async () => {
    try {
      const messages = await axios.get(
        'https://msg.xboxlive.com/users/me/conversations',
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'x-xbl-contract-version': '3'
          }
        }
      );
      
      // Process new messages
      for (const conversation of messages.data.conversations) {
        await this.processConversation(conversation);
      }
    } catch (error) {
      console.error('Error checking messages:', error);
    }
  }, 10000);
}

async processConversation(conversation) {
  const lastMessage = conversation.lastMessageRead;
  
  // Check if message contains invite trigger
  if (this.containsTrigger(lastMessage.body)) {
    const gamertag = conversation.participantId;
    
    // Trigger invite system
    await this.sendInvite(gamertag);
  }
}
```

### 4. Send Game Invites

Implement actual invite sending:

```javascript
async sendInvite(gamertag) {
  try {
    // Method 1: Using Xbox Live Party API
    const response = await axios.post(
      `https://social.xboxlive.com/users/xuid(${this.altAccountXUID})/people/${gamertag}/invite`,
      {
        inviteType: 'game',
        sessionId: process.env.SESSION_ID
      },
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'x-xbl-contract-version': '2'
        }
      }
    );
    
    console.log(`✅ Invite sent to ${gamertag}`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Failed to send invite:`, error);
    return { success: false, error: error.message };
  }
}
```

## Alternative: Using Xbox Device Token Flow

If using device code flow:

```javascript
async authenticateWithDeviceCode() {
  // Get device code
  const deviceResponse = await axios.post(
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode',
    {
      client_id: process.env.XBOX_APP_ID,
      scope: 'XboxLive.signin'
    }
  );
  
  const { device_code, user_code, verification_uri } = deviceResponse.data;
  
  console.log(`Please go to ${verification_uri} and enter code: ${user_code}`);
  
  // Poll for completion
  const maxAttempts = 120;
  for (let i = 0; i < maxAttempts; i++) {
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
      {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device_code,
        client_id: process.env.XBOX_APP_ID
      }
    );
    
    if (tokenResponse.data.access_token) {
      this.authToken = tokenResponse.data.access_token;
      return this.authToken;
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

## Environment Variables

Add to `.env`:

```env
# Xbox Live API
XBOX_APP_ID=your-app-id
XBOX_CLIENT_SECRET=your-client-secret
XBOX_REFRESH_TOKEN=your-refresh-token
XBOX_ALT_ACCOUNT_XUID=your-account-xuid

# Session Management
SESSION_ID=your-bedrock-session-id
```

## Testing

### Test Message Monitoring

```javascript
// In backend/index.js or separate test file
async function testXboxIntegration() {
  const xbox = new XboxManager();
  
  // Test authentication
  await xbox.getAuthToken();
  console.log('✅ Authentication successful');
  
  // Test message monitoring
  await xbox.monitorMessages();
  console.log('👂 Monitoring started');
  
  // Simulate incoming message
  console.log('Send a message to your alt Xbox account with keyword: "invite"');
}

testXboxIntegration();
```

### Test Invite Sending

```bash
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "gamertag": "TestPlayer",
    "message": "can I get an invite to the world?"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Invite sent to TestPlayer",
  "redirectServer": "your.server.com:19132"
}
```

## Debugging

Enable verbose logging:

```javascript
// In xbox-manager.js
const DEBUG = true;

if (DEBUG) {
  console.log('Request:', {
    method: 'POST',
    url: 'https://...',
    headers: { Authorization: '***' }
  });
}
```

## Common Issues

### Authentication fails
- Verify credentials in .env
- Check Xbox Live service status
- Ensure alt account is properly set up

### Messages not detected
- Check message monitoring interval
- Verify API response parsing
- Add console logging to processConversation()
- Use Xbox Live developers console for testing

### Invites not sending
- Verify account XUIDs
- Check session ID validity
- Test with Xbox SDK directly first

## References

- [Xbox Live API Documentation](https://docs.microsoft.com/en-us/gaming/xbox-live/api-ref/http/uri/method/get-user-gamer-card.markdown)
- [Xbox Authentication Flow](https://docs.microsoft.com/en-us/gaming/xbox-live/api-ref/http/uri/http-auth-auth.markdown)
- [Bedrock Connect API](https://bedrock-connect.github.io/)

## Next Steps

1. Register Xbox Live application
2. Implement authentication in xbox-manager.js
3. Set up message monitoring
4. Test invite sending
5. Deploy to production

