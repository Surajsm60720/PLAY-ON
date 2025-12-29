use serde::{Deserialize, Serialize};
use serde_json::json;

/// AniList API endpoint
const ANILIST_API_URL: &str = "https://graphql.anilist.co";

/// Represents an anime from AniList
#[derive(Debug, Serialize, Deserialize)]
pub struct Anime {
    pub id: i32,
    pub title: AnimeTitle,
    #[serde(rename = "coverImage")]
    pub cover_image: CoverImage,
    pub episodes: Option<i32>,
    pub status: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnimeTitle {
    pub romaji: Option<String>,
    pub english: Option<String>,
    pub native: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CoverImage {
    pub large: Option<String>,
    pub medium: Option<String>,
}

/// Response wrapper for AniList GraphQL queries
#[derive(Debug, Deserialize)]
struct AniListResponse<T> {
    data: T,
}

#[derive(Debug, Deserialize)]
struct MediaResponse {
    #[serde(rename = "Media")]
    media: Anime,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    #[serde(rename = "Page")]
    page: PageData,
}

#[derive(Debug, Deserialize)]
struct PageData {
    media: Vec<Anime>,
}

/// Search for anime by title
///
/// # Arguments
/// * `query` - The search query (anime title)
/// * `limit` - Maximum number of results to return
///
/// # Returns
/// * `Result<Vec<Anime>, String>` - List of matching anime or error message
pub async fn search_anime(query: &str, limit: i32) -> Result<Vec<Anime>, String> {
    let graphql_query = r#"
        query ($search: String, $perPage: Int) {
            Page(perPage: $perPage) {
                media(search: $search, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    coverImage {
                        large
                        medium
                    }
                    episodes
                    status
                    description
                }
            }
        }
    "#;

    let variables = json!({
        "search": query,
        "perPage": limit
    });

    let request_body = json!({
        "query": graphql_query,
        "variables": variables
    });

    // Make HTTP request
    let client = reqwest::Client::new();
    let response = client
        .post(ANILIST_API_URL)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    // Parse response
    let anilist_response: AniListResponse<SearchResponse> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(anilist_response.data.page.media)
}

/// Get anime details by ID
///
/// # Arguments
/// * `id` - The AniList anime ID
///
/// # Returns
/// * `Result<Anime, String>` - Anime details or error message
pub async fn get_anime_by_id(id: i32) -> Result<Anime, String> {
    let graphql_query = r#"
        query ($id: Int) {
            Media(id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    large
                    medium
                }
                episodes
                status
                description
            }
        }
    "#;

    let variables = json!({
        "id": id
    });

    let request_body = json!({
        "query": graphql_query,
        "variables": variables
    });

    // Make HTTP request
    let client = reqwest::Client::new();
    let response = client
        .post(ANILIST_API_URL)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    // Parse response
    let anilist_response: AniListResponse<MediaResponse> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(anilist_response.data.media)
}

/// Search for anime by window title (fuzzy matching)
/// This is useful for matching detected media player titles to AniList entries
///
/// # Arguments
/// * `window_title` - The window title from media player
///
/// # Returns
/// * `Result<Option<Anime>, String>` - Best matching anime or None if no good match
pub async fn match_anime_from_title(window_title: &str) -> Result<Option<Anime>, String> {
    // Clean up the window title (remove common suffixes like "- VLC media player")
    let cleaned_title = window_title
        .split(" - ")
        .next()
        .unwrap_or(window_title)
        .trim();

    // Search for the anime
    let results = search_anime(cleaned_title, 5).await?;

    // Return the first result (best match)
    Ok(results.into_iter().next())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i32,
    pub refresh_token: Option<String>,
}

/// Exchange Authorization Code for Access Token
pub async fn exchange_code_for_token(
    code: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<TokenResponse, String> {
    let client = reqwest::Client::new();
    let params = json!({
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code
    });

    let response = client
        .post("https://anilist.co/api/v2/oauth/token")
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&params)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {}", error_text));
    }

    let token_data: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(token_data)
}

/// Response from SaveMediaListEntry mutation
#[derive(Debug, Serialize, Deserialize)]
pub struct MediaListEntry {
    pub id: i32,
    pub progress: i32,
    pub status: String,
}

#[derive(Debug, Deserialize)]
struct SaveMediaListResponse {
    #[serde(rename = "SaveMediaListEntry")]
    save_media_list_entry: MediaListEntry,
}

/// Update anime progress on AniList (requires authentication)
///
/// # Arguments
/// * `access_token` - OAuth access token for authentication
/// * `media_id` - AniList media ID
/// * `progress` - Episode number to set as progress
/// * `status` - Optional status (CURRENT, COMPLETED, PAUSED, DROPPED, PLANNING, REPEATING)
///
/// # Returns
/// * `Result<MediaListEntry, String>` - Updated entry or error message
pub async fn update_media_progress(
    access_token: &str,
    media_id: i32,
    progress: i32,
    status: Option<&str>,
) -> Result<MediaListEntry, String> {
    let graphql_mutation = r#"
        mutation UpdateMediaProgress($mediaId: Int, $progress: Int, $status: MediaListStatus) {
            SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
                id
                progress
                status
            }
        }
    "#;

    let variables = if let Some(s) = status {
        json!({
            "mediaId": media_id,
            "progress": progress,
            "status": s
        })
    } else {
        json!({
            "mediaId": media_id,
            "progress": progress
        })
    };

    let request_body = json!({
        "query": graphql_mutation,
        "variables": variables
    });

    let client = reqwest::Client::new();
    let response = client
        .post(ANILIST_API_URL)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("Authorization", format!("Bearer {}", access_token))
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Update failed: {}", error_text));
    }

    let anilist_response: AniListResponse<SaveMediaListResponse> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(anilist_response.data.save_media_list_entry)
}
