/**
 * StreamPlayer - Video player component for streaming anime
 * 
 * Features:
 * - HLS stream support via hls.js
 * - Server/quality selection
 * - Standard playback controls
 * - Keyboard shortcuts
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { invoke } from '@tauri-apps/api/core';
import type { StreamingSource } from '../../services/streamingService';
import { Dropdown } from './Dropdown'; // Import Dropdown (same folder)
import './StreamPlayer.css';

// Custom HLS Loader that proxies requests through Tauri
const createTauriLoader = (headers: Record<string, string> = {}) => {
    return class TauriLoader extends Hls.DefaultConfig.loader {
        private _stats: any;

        constructor(config: any) {
            super(config);
            this._stats = {
                aborted: false,
                loaded: 0,
                retry: 0,
                total: 0,
                chunkCount: 0,
                bwEstimate: 0,
                loading: { start: 0, first: 0, end: 0 },
                parsing: { start: 0, end: 0 },
                buffering: { start: 0, first: 0, end: 0 },
            };
        }

        load(context: any, config: any, callbacks: any) {
            const { url } = context;
            const isPlaylist = url.includes('.m3u8') || context.type === 'manifest' || context.type === 'level';

            // Initialize stats timing
            this._stats.loading.start = performance.now();

            // Use Tauri proxy to fetch content
            console.log(`[StreamProxy] Fetching: ${url.substring(0, 60)}... with headers:`, headers);
            invoke<number[]>('stream_proxy', { url, headers })
                .then((response) => {
                    const now = performance.now();
                    this._stats.loading.first = now;
                    this._stats.loading.end = now;
                    this._stats.loaded = response.length;
                    this._stats.total = response.length;
                    this._stats.parsing.start = now;
                    this._stats.parsing.end = now;

                    const uint8Array = new Uint8Array(response);

                    // HLS.js expects string for playlists, ArrayBuffer for segments
                    let data: string | ArrayBuffer;
                    if (isPlaylist) {
                        // Decode as UTF-8 string for playlist files
                        data = new TextDecoder('utf-8').decode(uint8Array);
                        // Debug: log what we received
                        console.log(`[StreamProxy] Playlist response (${data.length} chars):`, data.substring(0, 300));
                    } else {
                        // Keep as ArrayBuffer for media segments
                        data = uint8Array.buffer;
                    }

                    callbacks.onSuccess(
                        {
                            url,
                            data,
                        },
                        this._stats,
                        context,
                        null // networkDetails
                    );
                })
                .catch((error) => {
                    console.error('[StreamProxy] Error:', error);
                    callbacks.onError(
                        { code: 404, text: error.toString() },
                        context,
                        null, // networkDetails
                        this._stats
                    );
                });
        }

        abort() {
            this._stats.aborted = true;
        }

        destroy() {
            // Cleanup if needed
        }
    };
};

interface StreamPlayerProps {
    sources: StreamingSource[];
    title?: string;
    onProgress?: (progress: number, currentTime: number, duration: number) => void;
    onEnded?: () => void;
    startTime?: number;
    headers?: Record<string, string>;
}

export default function StreamPlayer({
    sources,
    title,
    onProgress,
    onEnded,
    startTime = 0,
    headers,
}: StreamPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [selectedQuality, setSelectedQuality] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get best source (highest quality)
    const currentSource = sources[selectedQuality] || sources[0];

    // Initialize HLS or native playback
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentSource) return;

        setIsLoading(true);
        setError(null);

        // Cleanup previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (currentSource.isM3U8 && Hls.isSupported()) {
            console.log('[StreamPlayer] Initializing HLS with proxy');

            // Use custom loader to bypass CORS
            const hls = new Hls({
                loader: createTauriLoader(headers),
                debug: false,
            });

            hls.loadSource(currentSource.url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
                if (startTime > 0) {
                    video.currentTime = startTime;
                }
                video.play().catch(console.error);
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    console.error('[StreamPlayer] HLS error:', data);
                    setError('Failed to load video stream');
                    setIsLoading(false);
                    hls.destroy();
                }
            });

            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS support
            video.src = currentSource.url;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                if (startTime > 0) {
                    video.currentTime = startTime;
                }
                video.play().catch(console.error);
            });
        } else {
            // Direct MP4 playback
            video.src = currentSource.url;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                if (startTime > 0) {
                    video.currentTime = startTime;
                }
                video.play().catch(console.error);
            });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [currentSource, startTime, headers]);

    // Progress tracking
    useEffect(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = setInterval(() => {
            const video = videoRef.current;
            if (video && !video.paused) {
                setCurrentTime(video.currentTime);
                setDuration(video.duration || 0);

                if (onProgress && video.duration > 0) {
                    const progress = (video.currentTime / video.duration) * 100;
                    onProgress(progress, video.currentTime, video.duration);
                }
            }
        }, 1000);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [onProgress]);

    // Auto-hide controls
    const resetHideTimer = useCallback(() => {
        setShowControls(true);

        if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
        }

        hideControlsTimerRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    }, [isPlaying]);

    // Playback controls
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(console.error);
        } else {
            video.pause();
        }
    }, []);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const time = parseFloat(e.target.value);
        video.currentTime = time;
        setCurrentTime(time);
    }, []);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const vol = parseFloat(e.target.value);
        video.volume = vol;
        setVolume(vol);
        setIsMuted(vol === 0);
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        const container = containerRef.current;
        if (!container) return;

        try {
            if (!document.fullscreenElement) {
                await container.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (e) {
            console.error('Fullscreen error:', e);
        }
    }, []);

    // Video event handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            onEnded?.();
        };
        const handleError = () => {
            setError('Video playback error');
            setIsLoading(false);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
        };
    }, [onEnded]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current;
            if (!video) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    setVolume(video.volume);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    setVolume(video.volume);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleFullscreen, toggleMute]);

    // Format time
    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds)) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="stream-player error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`stream-player ${isFullscreen ? 'fullscreen' : ''}`}
            onMouseMove={resetHideTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="stream-video"
                onClick={togglePlay}
                playsInline
            />

            {isLoading && (
                <div className="stream-loading">
                    <div className="loader"></div>
                    <p>Loading stream...</p>
                </div>
            )}

            <div className={`stream-controls ${showControls ? 'visible' : ''}`}>
                {title && <div className="stream-title">{title}</div>}

                <div className="stream-progress">
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="progress-bar"
                    />
                    <span className="time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className="stream-buttons">
                    <button onClick={togglePlay} className="control-btn">
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    <div className="volume-control">
                        <button onClick={toggleMute} className="control-btn">
                            {isMuted ? '🔇' : '🔊'}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.1}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>

                    {sources.length > 1 && (
                        <Dropdown
                            value={String(selectedQuality)}
                            onChange={(val) => setSelectedQuality(parseInt(val))}
                            options={sources.map((src, idx) => ({
                                value: String(idx),
                                label: src.quality
                            }))}
                            className="w-32"
                        />
                    )}

                    <button onClick={toggleFullscreen} className="control-btn">
                        {isFullscreen ? '⛶' : '⛶'}
                    </button>
                </div>
            </div>
        </div>
    );
}
