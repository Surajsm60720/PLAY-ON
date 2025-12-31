/**
 * Discord Rich Presence Service
 * 
 * Uses tauri-plugin-drpc to show currently watching anime on Discord.
 * 
 * SETUP REQUIRED:
 * 1. Go to https://discord.com/developers/applications
 * 2. Create a new application (or use existing)
 * 3. Copy the Application ID and paste below
 * 4. Go to "Rich Presence" -> "Art Assets"
 * 5. Upload your app icon with the key name "app_icon"
 * 
 * USAGE:
 * - Call initDiscordRPC() on app startup
 * - Call updateActivity() when anime detection changes
 * - Call clearActivity() when nothing is playing
 * - Call stopDiscordRPC() when app closes
 */

import { start, stop, setActivity, clearActivity } from 'tauri-plugin-drpc';
import { Activity, Assets, Timestamps, Button } from 'tauri-plugin-drpc/activity';

// ============================================================================
// CONFIGURATION - UPDATE THIS WITH YOUR DISCORD APPLICATION ID
// ============================================================================
// Get this from: https://discord.com/developers/applications -> Your App -> General Information
const DISCORD_APPLICATION_ID = '1455963833373032448';

// Asset key names (upload these in Discord Developer Portal -> Rich Presence -> Art Assets)
const APP_ICON_ASSET = 'app_icon';

// ============================================================================
// STATE
// ============================================================================
let isInitialized = false;
let currentAnimeId: number | null = null;
let watchStartTime: number | null = null;

/**
 * Initialize Discord Rich Presence
 * Call this on app startup
 */
export async function initDiscordRPC(): Promise<boolean> {
    try {
        await start(DISCORD_APPLICATION_ID);
        isInitialized = true;
        console.log('[Discord RPC] Initialized successfully');
        return true;
    } catch (err) {
        console.error('[Discord RPC] Failed to initialize:', err);
        return false;
    }
}

/**
 * Stop Discord Rich Presence
 * Call this on app close
 */
export async function stopDiscordRPC(): Promise<void> {
    try {
        await stop();
        isInitialized = false;
        currentAnimeId = null;
        watchStartTime = null;
        console.log('[Discord RPC] Stopped');
    } catch (err) {
        console.error('[Discord RPC] Failed to stop:', err);
    }
}

/**
 * Update Discord activity with currently watching anime
 * ONLY updates if there's a valid AniList match
 */
export async function updateAnimeActivity(params: {
    animeName: string;
    episode?: number | null;
    season?: number | null;
    anilistId: number;  // Required - must have AniList match
    coverImage?: string | null;
    totalEpisodes?: number | null;
}): Promise<void> {
    if (!isInitialized) {
        const success = await initDiscordRPC();
        if (!success) return;
    }

    const { animeName, episode, season, anilistId, coverImage, totalEpisodes } = params;

    // Require AniList ID - skip if no match found
    if (!anilistId) {
        console.log('[Discord RPC] Skipping update - no AniList match');
        return;
    }

    // Check if this is the same anime (avoid unnecessary updates)
    const isSameAnime = anilistId === currentAnimeId;

    // If different anime, reset the watch start time
    if (!isSameAnime) {
        currentAnimeId = anilistId;
        watchStartTime = Date.now();
    }

    try {
        // Build the activity
        let activity = new Activity();

        // Set details (main text) - anime name (max 128 chars)
        const truncatedName = animeName.length > 128 ? animeName.substring(0, 125) + '...' : animeName;
        activity = activity.setDetails(truncatedName);

        // Set state (secondary text) - episode info
        let stateText = '';
        if (episode !== null && episode !== undefined) {
            stateText = `Episode ${episode}`;
            if (totalEpisodes) {
                stateText += ` of ${totalEpisodes}`;
            }
            if (season !== null && season !== undefined && season > 1) {
                stateText = `S${season} • ${stateText}`;
            }
        } else {
            stateText = 'Watching';
        }
        activity = activity.setState(stateText);

        // Set timestamps (shows elapsed time on Discord)
        if (watchStartTime) {
            const timestamps = new Timestamps(watchStartTime);
            activity = activity.setTimestamps(timestamps);
        }

        // Set assets (images)
        const assets = new Assets();

        // Use AniList cover image as large image (Discord supports external URLs)
        if (coverImage) {
            assets.setLargeImage(coverImage);
            assets.setLargeText(animeName);
        } else {
            assets.setLargeImage(APP_ICON_ASSET);
            assets.setLargeText(animeName);
        }

        // Use app icon as small image (must be uploaded to Discord Developer Portal)
        assets.setSmallImage(APP_ICON_ASSET);
        assets.setSmallText('PLAY-ON!');

        activity = activity.setAssets(assets);

        // Add button to view on AniList
        activity = activity.setButton([
            new Button('View on AniList', `https://anilist.co/anime/${anilistId}`)
        ]);

        await setActivity(activity);
        console.log('[Discord RPC] Activity updated:', animeName, episode ? `Ep ${episode}` : '');
    } catch (err) {
        console.error('[Discord RPC] Failed to update activity:', err);
    }
}

/**
 * Set a generic "browsing" activity when not watching anything
 */
export async function setBrowsingActivity(): Promise<void> {
    if (!isInitialized) {
        const success = await initDiscordRPC();
        if (!success) return;
    }

    try {
        let activity = new Activity()
            .setDetails('Browsing anime')
            .setState('Looking for something to watch');

        const timestamps = new Timestamps(Date.now());
        activity = activity.setTimestamps(timestamps);

        const assets = new Assets()
            .setLargeImage(APP_ICON_ASSET)
            .setLargeText('PLAY-ON!');

        activity = activity.setAssets(assets);

        await setActivity(activity);
        currentAnimeId = null;
        watchStartTime = null;
        console.log('[Discord RPC] Set to browsing mode');
    } catch (err) {
        console.error('[Discord RPC] Failed to set browsing activity:', err);
    }
}

/**
 * Clear the Discord activity
 */
export async function clearDiscordActivity(): Promise<void> {
    try {
        await clearActivity();
        currentAnimeId = null;
        watchStartTime = null;
        console.log('[Discord RPC] Activity cleared');
    } catch (err) {
        console.error('[Discord RPC] Failed to clear activity:', err);
    }
}

/**
 * Check if Discord RPC is initialized
 */
export function isDiscordRPCInitialized(): boolean {
    return isInitialized;
}

/**
 * Get current watching anime ID
 */
export function getCurrentAnimeId(): number | null {
    return currentAnimeId;
}
