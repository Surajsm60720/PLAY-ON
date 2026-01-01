import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { updateProgress } from '../../lib/localAnimeDb';
import { syncEntryToAniList } from '../../lib/syncService';
import './FloatingNowPlaying.css';

interface DetectionResult {
    status: 'detected' | 'not_media_player' | 'no_window';
    player?: string;
    window_title?: string;
    parsed?: {
        title: string | null;
        episode: number | null;
        season: number | null;
    };
    anilist_match?: {
        id: number;
        title: {
            romaji: string;
            english: string | null;
        };
        coverImage: {
            large: string;
            medium: string;
        };
        episodes: number | null;
    } | null;
}

interface FloatingNowPlayingProps {
    onAnimeDetected?: (result: DetectionResult) => void;
}

export function FloatingNowPlaying({ onAnimeDetected }: FloatingNowPlayingProps) {
    const [detection, setDetection] = useState<DetectionResult | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'waiting' | 'saving' | 'syncing' | 'synced' | 'error'>('idle');
    const [watchProgress, setWatchProgress] = useState<number>(0);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const lastSavedRef = useRef<string | null>(null);
    const watchTimeRef = useRef<{
        key: string;
        startTime: number;
        synced: boolean;
        lastSeen?: number;
    } | null>(null);

    const DEBUG_MODE = false;
    const SYNC_THRESHOLD_MS = DEBUG_MODE ? 30 * 1000 : 10 * 60 * 1000;

    const saveAndSync = async (result: DetectionResult) => {
        if (!result.parsed?.title || !result.parsed?.episode) return;

        const anilistMatch = result.anilist_match;
        const saveKey = `${anilistMatch?.id || result.parsed.title}-ep${result.parsed.episode}`;

        if (lastSavedRef.current === saveKey) return;
        lastSavedRef.current = saveKey;

        try {
            setSyncStatus('saving');

            const entry = updateProgress(
                String(anilistMatch?.id || result.parsed.title),
                {
                    title: anilistMatch?.title.english || anilistMatch?.title.romaji || result.parsed.title,
                    titleRomaji: anilistMatch?.title.romaji,
                    episode: result.parsed.episode,
                    totalEpisodes: anilistMatch?.episodes || undefined,
                    anilistId: anilistMatch?.id,
                    coverImage: anilistMatch?.coverImage.large || anilistMatch?.coverImage.medium,
                }
            );

            console.log('[FloatingNowPlaying] Saved to local DB:', entry.title, 'Ep', entry.episode);

            if (anilistMatch?.id) {
                setSyncStatus('syncing');
                const synced = await syncEntryToAniList(entry);
                setSyncStatus(synced ? 'synced' : 'error');
            } else {
                setSyncStatus('idle');
            }
        } catch (err) {
            console.error('[FloatingNowPlaying] Save/sync error:', err);
            setSyncStatus('error');
        }
    };

    useEffect(() => {
        const detectAnime = async () => {
            try {
                const result = await invoke<string>('detect_anime_command');
                const parsed: DetectionResult = JSON.parse(result);
                setDetection(parsed);

                if (parsed.status === 'detected' && parsed.parsed?.episode) {
                    // Show the floating pill with animation
                    setIsVisible(true);

                    if (onAnimeDetected) {
                        onAnimeDetected(parsed);
                    }

                    const anilistMatch = parsed.anilist_match;
                    const episodeKey = `${anilistMatch?.id || parsed.parsed.title}-ep${parsed.parsed.episode}`;

                    if (!watchTimeRef.current || watchTimeRef.current.key !== episodeKey) {
                        console.log('[FloatingNowPlaying] New tracking session:', episodeKey);
                        watchTimeRef.current = { key: episodeKey, startTime: Date.now(), synced: false };
                        lastSavedRef.current = null;
                        setSyncStatus('waiting');
                        setWatchProgress(0);
                        setRemainingTime(SYNC_THRESHOLD_MS / 1000);
                    }

                    const watchedMs = Date.now() - watchTimeRef.current.startTime;
                    const progress = Math.min((watchedMs / SYNC_THRESHOLD_MS) * 100, 100);
                    const remaining = Math.max(0, Math.ceil((SYNC_THRESHOLD_MS - watchedMs) / 1000));
                    setWatchProgress(progress);
                    setRemainingTime(remaining);

                    if (watchedMs >= SYNC_THRESHOLD_MS && !watchTimeRef.current.synced) {
                        watchTimeRef.current.synced = true;
                        console.log('[FloatingNowPlaying] ✓ Threshold reached! Syncing...');
                        saveAndSync(parsed);
                    }
                } else {
                    if (watchTimeRef.current && !watchTimeRef.current.synced) {
                        const gracePeriodMs = 60 * 1000;
                        const timeSinceLastDetection = Date.now() - (watchTimeRef.current.lastSeen || Date.now());

                        if (!watchTimeRef.current.lastSeen) {
                            watchTimeRef.current.lastSeen = Date.now();
                        }

                        if (timeSinceLastDetection > gracePeriodMs) {
                            console.log('[FloatingNowPlaying] Playback lost for >60s, hiding pill');
                            watchTimeRef.current = null;
                            setWatchProgress(0);
                            setSyncStatus('idle');
                            setIsVisible(false);
                        }
                    } else if (!watchTimeRef.current) {
                        // Not watching anything, hide the pill
                        setIsVisible(false);
                    }
                }

                if (parsed.status === 'detected' && watchTimeRef.current) {
                    watchTimeRef.current.lastSeen = Date.now();
                }

            } catch (err) {
                console.error('Error detecting anime:', err);
            }
        };

        detectAnime();
        const interval = setInterval(detectAnime, 3000);
        return () => clearInterval(interval);
    }, [onAnimeDetected]);

    const isPlaying = detection?.status === 'detected';
    const hasMatch = isPlaying && detection?.anilist_match;

    if (!isVisible) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`floating-now-playing ${isExpanded ? 'expanded' : ''}`}>
            {/* Glow effect */}
            <div className="floating-glow" />

            {/* Main pill content */}
            <div
                className="floating-pill-content"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Cover image thumbnail */}
                {hasMatch && detection.anilist_match?.coverImage && (
                    <div className="floating-cover">
                        <img
                            src={detection.anilist_match.coverImage.medium || detection.anilist_match.coverImage.large}
                            alt=""
                        />
                    </div>
                )}

                {/* Info section */}
                <div className="floating-info">
                    {/* Status indicator & title */}
                    <div className="floating-header">
                        <div className="floating-status-dot" />
                        <span className="floating-title">
                            {hasMatch
                                ? (detection.anilist_match?.title.english || detection.anilist_match?.title.romaji)
                                : detection?.parsed?.title || 'Unknown Title'
                            }
                        </span>
                    </div>

                    {/* Episode & player info */}
                    <div className="floating-meta">
                        {detection?.parsed?.episode && (
                            <span className="floating-episode">
                                EP {detection.parsed.episode}
                                {hasMatch && detection.anilist_match?.episodes && (
                                    <span className="floating-total">/{detection.anilist_match.episodes}</span>
                                )}
                            </span>
                        )}
                        {detection?.player && (
                            <span className="floating-player">{detection.player}</span>
                        )}
                    </div>
                </div>

                {/* Sync status indicator */}
                <div className="floating-sync-status">
                    {syncStatus === 'waiting' && (
                        <div className="sync-timer">
                            <svg className="sync-progress-ring" viewBox="0 0 24 24">
                                <circle
                                    className="sync-progress-bg"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    strokeWidth="2"
                                />
                                <circle
                                    className="sync-progress-fill"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    strokeWidth="2"
                                    strokeDasharray={`${watchProgress * 0.628} 62.8`}
                                    transform="rotate(-90 12 12)"
                                />
                            </svg>
                            <span className="sync-time">{formatTime(remainingTime)}</span>
                        </div>
                    )}
                    {syncStatus === 'saving' && <span className="sync-icon">💾</span>}
                    {syncStatus === 'syncing' && <span className="sync-icon spinning">🔄</span>}
                    {syncStatus === 'synced' && <span className="sync-icon synced">✓</span>}
                    {syncStatus === 'error' && <span className="sync-icon error">⚠</span>}
                </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
                <div className="floating-expanded">
                    <div className="expanded-detail">
                        <span className="detail-label">Status</span>
                        <span className="detail-value">
                            {syncStatus === 'waiting' ? `Syncing in ${formatTime(remainingTime)}` :
                                syncStatus === 'syncing' ? 'Syncing to AniList...' :
                                    syncStatus === 'synced' ? 'Synced!' :
                                        syncStatus === 'error' ? 'Sync failed' : 'Playing'}
                        </span>
                    </div>
                    {hasMatch && (
                        <div className="expanded-detail">
                            <span className="detail-label">AniList</span>
                            <span className="detail-value matched">Matched ✓</span>
                        </div>
                    )}
                    {detection?.window_title && (
                        <div className="expanded-detail file-info">
                            <span className="detail-label">File</span>
                            <span className="detail-value file-name" title={detection.window_title}>
                                {detection.window_title.length > 40
                                    ? detection.window_title.substring(0, 40) + '...'
                                    : detection.window_title
                                }
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default FloatingNowPlaying;
