/// Media Player Detection Module
///
/// PURPOSE: Filter out non-media windows using allow-listing
/// Only track windows from known media players
///
/// APPROACH: Simple, deterministic matching
/// - No guessing or complex heuristics
/// - Media players advertise themselves in window titles
/// - Easy to extend and debug

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MediaPlayer {
    VLC,
    MPV,
    MPC,
    Browser,
}

/// Detect media player type from window title
///
/// Returns Some(MediaPlayer) if the window belongs to a known media player
/// Returns None for all other windows (VS Code, File Explorer, etc.)
///
/// This is the core filtering logic - only known media players pass through
pub fn detect_media_player(title: &str) -> Option<MediaPlayer> {
    let title = title.to_lowercase();

    // VLC Media Player
    if title.contains("vlc media player") {
        return Some(MediaPlayer::VLC);
    }

    // MPV Player
    if title.contains("mpv") {
        return Some(MediaPlayer::MPV);
    }

    // Media Player Classic (MPC-HC, MPC-BE)
    if title.contains("mpc") || title.contains("media player classic") {
        return Some(MediaPlayer::MPC);
    }

    // Browser-based media (YouTube, Netflix, etc.)
    if title.contains("youtube")
        || title.contains("netflix")
        || title.contains("prime video")
        || title.contains("crunchyroll")
        || title.contains("funimation")
    {
        return Some(MediaPlayer::Browser);
    }

    // Not a known media player - ignore
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vlc_detection() {
        assert_eq!(
            detect_media_player("My Video - VLC media player"),
            Some(MediaPlayer::VLC)
        );
    }

    #[test]
    fn test_browser_detection() {
        assert_eq!(
            detect_media_player("Anime Episode 1 - YouTube - Chrome"),
            Some(MediaPlayer::Browser)
        );
    }

    #[test]
    fn test_non_media_window() {
        assert_eq!(detect_media_player("Visual Studio Code"), None);
        assert_eq!(detect_media_player("File Explorer"), None);
    }
}
