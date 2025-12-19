// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Import the win_name module
mod win_name;
// Import the media_player module
mod media_player;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Tauri command to get the currently active window title
/// Returns the window title as a String, or "No active window" if none found
///
/// NOTE: This returns ALL windows, not just media players
/// Use get_active_media_window for filtered results
#[tauri::command]
fn get_active_window() -> String {
    win_name::get_active_window_title().unwrap_or_else(|| "No active window".to_string())
}

/// Tauri command to get active media player window
/// Returns JSON with player type and title, or "No media playing" if not a media player
///
/// This filters out non-media windows (VS Code, File Explorer, etc.)
/// Only returns data for known media players
#[tauri::command]
fn get_active_media_window() -> String {
    use media_player::detect_media_player;

    // Get active window title
    let title = match win_name::get_active_window_title() {
        Some(t) => t,
        None => return "No active window".to_string(),
    };

    // Check if it's a media player
    match detect_media_player(&title) {
        Some(player) => {
            // Return structured info
            format!("{:?}: {}", player, title)
        }
        None => {
            // Not a media player - ignore
            "No media playing".to_string()
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_active_window,
            get_active_media_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
