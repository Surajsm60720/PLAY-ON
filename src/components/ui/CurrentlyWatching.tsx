/**
 * Sidebar Component - Discord-style left navigation
 * 
 * Contains:
 * - Main navigation items (Media List, History, Statistics)
 * - Profile section at bottom
 */

import { useAuth } from '../../hooks/useAuth';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { USER_MEDIA_LIST_QUERY } from '../../api/anilistClient';
import { useNavigate } from 'react-router-dom';
import './CurrentlyWatching.css';

function CurrentlyWatching() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const { data, loading: listLoading } = useQuery(USER_MEDIA_LIST_QUERY, {
        variables: { userId: user?.id, status: 'CURRENT' },
        skip: !user?.id,
        fetchPolicy: 'cache-first'
    });

    const animeList = useMemo(() => {
        if (!data?.Page?.mediaList) return [];
        return data.Page.mediaList;
    }, [data]);

    const handleIncrement = async (mediaId: number, currentProgress: number) => {
        // Optimistic UI updates are handled by Apollo Client cache if mutation is set up correctly
        // But for now we just use the mutation function
        try {
            const { updateMediaProgress } = await import('../../api/anilistClient');
            await updateMediaProgress(mediaId, currentProgress + 1);
        } catch (e) {
            console.error("Failed to update progress", e);
        }
    };

    if (authLoading || (listLoading && !data)) {
        return <div style={{ padding: '2rem', color: '#B5BAC1' }}>Loading...</div>;
    }

    if (!user) return null;

    return (
        <div className="watching-container">
            <h2 className="watching-header">
                📺 Currently Watching - {user.name}
            </h2>

            {!animeList || animeList.length === 0 ? (
                <p style={{ color: '#6B7280' }}>No titles currently watching</p>
            ) : (
                <div className="watching-grid">
                    {animeList.map((entry: any) => (
                        <div
                            key={entry.id}
                            className="watching-card"
                            onClick={() => navigate(`/anime/${entry.media.id}`)}
                        >
                            {/* Inverted Corner Tab */}
                            <div className="progress-tab">
                                <span style={{ color: '#C7B8EA' }}>{entry.progress}</span>
                                <span style={{ margin: '0 4px' }}>/</span>
                                <span>{entry.media.episodes || '?'}</span>
                            </div>

                            {/* Poster Cover Image */}
                            <img
                                src={entry.media.coverImage?.medium || entry.media.coverImage?.large}
                                alt={entry.media.title?.romaji}
                                className="watching-cover"
                            />

                            {/* Info */}
                            <div className="watching-info">
                                <h3 className="watching-title">
                                    {entry.media.title?.english || entry.media.title?.romaji}
                                </h3>

                                <div className="watching-progress-wrapper">
                                    <div className="watching-progress-bar-bg">
                                        <div
                                            className="watching-progress-bar-fill"
                                            style={{
                                                width: `${(entry.progress / (entry.media.episodes || 1)) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Update Button */}
                                <button
                                    className="watching-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleIncrement(entry.media.id, entry.progress);
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    +1 Episode
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CurrentlyWatching;

/**
 * USAGE IN YOUR APP:
 * ==================
 * 
 * // In Home.tsx or any page
 * import CurrentlyWatching from '../components/CurrentlyWatching';
 * 
 * function Home() {
 *     return (
 *         <Layout>
 *             <CurrentlyWatching />
 *         </Layout>
 *     );
 * }
 */
