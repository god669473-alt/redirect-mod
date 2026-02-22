import { world, system } from "@minecraft/server";

/**
 * Redirect Mod - Main Script
 * Handles player join events and redirect logic
 */

// Configuration
const CONFIG = {
  redirectServerIP: "YOUR_SERVER_IP",
  redirectServerPort: 19132,
  backendURL: "http://localhost:3000",
  maxRedirectDelay: 10000, // 10 seconds
};

// Track players who need redirect
const playersToRedirect = new Map();

/**
 * Initialize redirect system
 */
function initializeRedirectSystem() {
  console.log("🔀 Initializing Redirect System...");

  // Listen for player joins
  world.afterEvents.playerSpawn.subscribe(onPlayerSpawn);
  
  // Listen for player leaves
  world.beforeEvents.playerLeave.subscribe(onPlayerLeave);

  console.log("✅ Redirect System initialized");
}

/**
 * Handle player spawn event
 */
function onPlayerSpawn(event) {
  const player = event.player;
  const gamertag = player.name;
  
  console.log(`👤 Player spawned: ${gamertag}`);
  
  // Notify backend about player join
  notifyPlayerJoin(gamertag, player.id);
}

/**
 * Handle player leave event
 */
function onPlayerLeave(event) {
  const player = event.player;
  const gamertag = player.name;
  
  console.log(`👋 Player leaving: ${gamertag}`);
  
  // Clean up redirect data
  playersToRedirect.delete(gamertag);
}

/**
 * Notify backend that player joined
 */
async function notifyPlayerJoin(gamertag, uuid) {
  try {
    const response = await fetch(`${CONFIG.backendURL}/api/player/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gamertag,
        uuid,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    
    if (data.success && data.redirectServer) {
      console.log(`🔀 Redirect queued for ${gamertag} to ${data.redirectServer}`);
      playersToRedirect.set(gamertag, {
        server: data.redirectServer,
        timestamp: Date.now(),
      });
      
      // Schedule redirect execution
      scheduleRedirect(gamertag);
    }
  } catch (error) {
    console.error(`❌ Error notifying backend:`, error);
  }
}

/**
 * Schedule redirect for a player
 */
function scheduleRedirect(gamertag) {
  // Wait a moment for player to fully load
  system.runTimeout(() => {
    redirectPlayer(gamertag);
  }, 20); // ~1 second in ticks
}

/**
 * Redirect player to target server
 */
function redirectPlayer(gamertag) {
  try {
    const redirectData = playersToRedirect.get(gamertag);
    if (!redirectData) return;

    const player = world.getPlayers().find(p => p.name === gamertag);
    if (!player) return;

    const [serverIP, serverPort] = redirectData.server.split(':');

    // Send redirect information to player
    player.runCommand(`say §c📡 Connecting to main server...`);
    
    // Show disconnect message with server info
    player.runCommand(`titleraw @s actionbar {"text":"Redirecting to ${serverIP}:${serverPort}"}`);

    console.log(`✅ Redirect sent to ${gamertag}: ${redirectData.server}`);

    // Clean up after redirect
    playersToRedirect.delete(gamertag);

  } catch (error) {
    console.error(`❌ Error redirecting player ${gamertag}:`, error);
  }
}

/**
 * Get list of players marked for redirect (debugging)
 */
function getRedirectQueue() {
  return Array.from(playersToRedirect.entries()).map(([gamertag, data]) => ({
    gamertag,
    server: data.server,
    ageMs: Date.now() - data.timestamp,
  }));
}

// Initialize on world load
system.runTimeout(() => {
  initializeRedirectSystem();
}, 1);

// Export for testing
export { initializeRedirectSystem, redirectPlayer, getRedirectQueue };
