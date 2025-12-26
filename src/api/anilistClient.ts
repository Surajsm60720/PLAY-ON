/**
 * GraphQL Query to fetch public profile and favorite anime by username.
 * No tokens or keys required for this.
 */
const PUBLIC_USER_QUERY = `
query ($name: String) {
  User (name: $name) {
    id
    name
    avatar {
      large
      medium
    }
    bannerImage
    favourites {
      anime {
        nodes {
          id
          title {
            english
            romaji
          }
          coverImage {
            large
            extraLarge
          }
        }
      }
    }
  }
}
`;

/**
 * Fetches public user data and favorites from AniList by username.
 * 
 * @param {string} username The AniList username to fetch
 * @returns {Promise<any>} The public user data
 */
export async function fetchPublicUser(username: string) {
    const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: PUBLIC_USER_QUERY,
            variables: { name: username }
        }),
    });

    return response.json();
}
