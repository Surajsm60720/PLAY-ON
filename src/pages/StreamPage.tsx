/**
 * StreamPage - Full-screen streaming page for anime episodes
 * 
 * Route: /stream/:provider/:episodeId
 * Query params: ?title=...&episode=...&animeId=...
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import StreamPlayer from '../components/ui/StreamPlayer';
import {
    getEpisodeSources,
    type ProviderType,
    type StreamingSource,
} from '../services/tauriStreamingService';
import './StreamPage.css';

export default function StreamPage() {
    const { provider, episodeId } = useParams<{ provider: string; episodeId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Query params
    const title = searchParams.get('title') || 'Unknown';
    const episodeNum = searchParams.get('episode') || '1';

    // State
    const [sources, setSources] = useState<StreamingSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(true);

    // Load sources
    useEffect(() => {
        const loadSources = async () => {
            if (!provider || !episodeId) {
                setError('Missing provider or episode ID');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Fetch sources
                const result = await getEpisodeSources(
                    episodeId,
                    provider as ProviderType
                );

                if (result.sources.length === 0) {
                    setError('No streaming sources found');
                } else {
                    setSources(result.sources);
                }
            } catch (err) {
                console.error('[StreamPage] Failed to load sources:', err);
                setError(`Failed to load sources: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        };

        loadSources();
    }, [provider, episodeId]);

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    // Handle video ended
    const handleEnded = useCallback(() => {
        setShowInfo(true);
    }, []);

    // Handle progress
    const handleProgress = useCallback((_progress: number, _currentTime: number, _duration: number) => {
        // Could save progress here
    }, []);

    if (loading) {
        return (
            <div className="stream-page loading">
                <div className="loader"></div>
                <p>Loading streaming sources...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stream-page error">
                <h2>⚠️ Streaming Error</h2>
                <p>{error}</p>
                <button onClick={handleBack} className="back-btn">
                    Go Back
                </button>
            </div>
        );
    }

    if (sources.length === 0) {
        return (
            <div className="stream-page error">
                <h2>No Sources Available</h2>
                <p>Could not find streaming sources for this episode.</p>
                <button onClick={handleBack} className="back-btn">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="stream-page">
            {/* Back button and info overlay */}
            <div className={`stream-info-overlay ${showInfo ? 'visible' : ''}`}>
                <button className="back-btn" onClick={handleBack}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <div className="episode-info">
                    <h1>{title}</h1>
                    <p>Episode {episodeNum}</p>
                    <p className="provider-badge">{provider}</p>
                </div>
            </div>

            {/* Video Player */}
            <div
                className="player-wrapper"
                onMouseMove={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
            >
                <StreamPlayer
                    sources={sources}
                    title={`${title} - Episode ${episodeNum}`}
                    onProgress={handleProgress}
                    onEnded={handleEnded}
                />
            </div>
        </div>
    );
}
