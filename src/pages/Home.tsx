import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Layout from '../components/Layout';

/**
 * Home Component
 * 
 * PURPOSE: The main landing page after onboarding
 * 
 * NAVIGATION:
 * Now handled by PillNav component in Layout
 * No need for individual navigation buttons on each page
 * 
 * MEDIA PLAYER DETECTION:
 * Uses Tauri's invoke() to call Rust backend command
 * Displays currently active MEDIA PLAYER window (filtered)
 * Ignores non-media windows (VS Code, File Explorer, etc.)
 */
function Home() {
    const [mediaWindow, setMediaWindow] = useState<string>('Loading...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Function to fetch active media player window
        const fetchMediaWindow = async () => {
            try {
                const result = await invoke<string>('get_active_media_window');
                setMediaWindow(result);
                setError(null);
            } catch (err) {
                console.error('Error fetching media window:', err);
                setError('Failed to get media window');
            }
        };

        // Fetch immediately
        fetchMediaWindow();

        // Set up interval to fetch every 2 seconds
        const interval = setInterval(fetchMediaWindow, 2000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    // Check if it's a "no media" state
    const isNoMedia = mediaWindow === 'No media playing' || mediaWindow === 'No active window';

    return (
        <Layout>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 200px)',
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '3rem 4rem',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(200, 200, 220, 0.3)',
                    textAlign: 'center',
                    maxWidth: '800px',
                    width: '100%',
                }}>
                    <h1 style={{
                        fontSize: '4rem',
                        background: 'linear-gradient(135deg, #C7B8EA 0%, #B8A4E8 100%)', // Pastel purple
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1rem',
                        fontWeight: '700',
                    }}>
                        Home Page
                    </h1>
                    <p style={{
                        fontSize: '1.2rem',
                        color: '#6B7280',
                        marginTop: '1rem',
                        marginBottom: '2rem',
                    }}>
                        Welcome to PLAY-ON! Use the navigation bar above to explore.
                    </p>

                    {/* Media Player Detection Display */}
                    <div style={{
                        background: isNoMedia
                            ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(199, 184, 234, 0.1) 0%, rgba(184, 164, 232, 0.1) 100%)',
                        padding: '2rem',
                        borderRadius: '16px',
                        marginTop: '2rem',
                        border: isNoMedia
                            ? '1px solid rgba(156, 163, 175, 0.3)'
                            : '1px solid rgba(199, 184, 234, 0.3)',
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            color: '#4B5563',
                            marginBottom: '1rem',
                            fontWeight: '600',
                        }}>
                            🎬 Media Player Detection
                        </h2>

                        {error ? (
                            <p style={{
                                fontSize: '1.1rem',
                                color: '#EF4444',
                                fontFamily: 'monospace',
                            }}>
                                {error}
                            </p>
                        ) : (
                            <>
                                <p style={{
                                    fontSize: '1.1rem',
                                    color: isNoMedia ? '#9CA3AF' : '#374151',
                                    fontFamily: 'monospace',
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    wordBreak: 'break-word',
                                    fontStyle: isNoMedia ? 'italic' : 'normal',
                                }}>
                                    {mediaWindow}
                                </p>

                                {!isNoMedia && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: 'rgba(134, 239, 172, 0.2)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(134, 239, 172, 0.4)',
                                    }}>
                                        <p style={{
                                            fontSize: '0.9rem',
                                            color: '#15803D',
                                            fontWeight: '600',
                                        }}>
                                            ✓ Media player detected!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        <p style={{
                            fontSize: '0.9rem',
                            color: '#9CA3AF',
                            marginTop: '1rem',
                            fontStyle: 'italic',
                        }}>
                            Updates every 2 seconds • Filters non-media windows
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Home;
