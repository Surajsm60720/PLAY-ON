import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import colors from '../../styles/colors';
import { useAuth } from '../../hooks/useAuth'; // Our custom hook that asks Context for data
import SidebarItem from './SidebarItem';
import { ListIcon, HistoryIcon, StatsIcon, HomeIcon } from '../ui/Icons';

interface SidebarNavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Fetch public user data from global context
    const { user, loading, error, isAuthenticated } = useAuth();

    const sidebarItems: SidebarNavItem[] = [
        { label: 'Home', path: '/home', icon: <HomeIcon /> },
        { label: 'Media List', path: '/anime-list', icon: <ListIcon /> },
        { label: 'History', path: '/history', icon: <HistoryIcon /> },
        { label: 'Statistics', path: '/statistics', icon: <StatsIcon /> },
    ];

    const handleNavClick = (path: string) => {
        navigate(path);
    };

    return (
        <div style={{
            width: '240px',
            height: '100vh',
            background: '#2B2D31',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100,
            paddingTop: '32px', // Space for transparent titlebar
        }}>
            {/* App Logo/Title */}
            <div style={{
                padding: '1rem 1rem 0.5rem 1rem',
                borderBottom: '2px solid #1E1F22',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: colors.pastelPurple,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                    }}>
                        🎬
                    </div>
                    <div>
                        <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#FFFFFF',
                        }}>
                            PLAY-ON!
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#B5BAC1',
                        }}>
                            Media Tracker
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <div style={{
                flex: 1,
                padding: '1rem 0.5rem',
                overflowY: 'auto',
            }}>
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path === '/anime-list' && location.pathname.startsWith('/anime/'));

                    return (
                        <SidebarItem
                            key={item.path}
                            label={item.label}
                            icon={item.icon}
                            isActive={isActive}
                            onClick={() => handleNavClick(item.path)}
                        />
                    );
                })}
            </div>

            {/* Profile Section */}
            <div style={{
                padding: '0.75rem',
                borderTop: '2px solid #1E1F22',
                background: '#232428',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                }}
                    onClick={() => setShowProfileModal(true)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#35373C';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    {/* Avatar */}
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: loading ? '#404249' : (!isAuthenticated || error || !user?.avatar?.large) ? colors.pastelPink : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        flexShrink: 0,
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        {loading ? (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: 'linear-gradient(90deg, #404249 0%, #4f5159 50%, #404249 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'pulse 1.5s ease-in-out infinite',
                            }} />
                        ) : !isAuthenticated || error || !user?.avatar?.large ? (
                            '👤'
                        ) : (
                            <img
                                src={user.avatar.large}
                                alt={`${user?.name}'s avatar`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        )}
                    </div>

                    {/* User Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: '#FFFFFF',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {loading ? 'Loading...' : error ? 'Anime Fan' : user?.name || 'Anime Fan'}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#B5BAC1',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {loading ? '...' : 'Public Profile'}
                        </div>
                    </div>

                    {/* Settings Icon */}
                    <div style={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#B5BAC1',
                        fontSize: '1rem',
                    }}>
                        ⚙️
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div style={{
                    position: 'fixed',
                    left: '250px',
                    bottom: '20px',
                    width: '300px',
                    background: '#1E1F22',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    padding: '1.5rem',
                    zIndex: 1000,
                    border: '1px solid #313338',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                    }}>
                        <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.1rem' }}>User Profile</h3>
                        <button
                            onClick={() => setShowProfileModal(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#B5BAC1',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >×</button>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: colors.pastelPink,
                            margin: '0 auto 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            overflow: 'hidden',
                        }}>
                            {!isAuthenticated || !user?.avatar?.large ? '👤' : (
                                <img src={user.avatar.large} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                        </div>
                        <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '1.2rem' }}>
                            {user?.name || 'Guest User'}
                        </div>
                        <div style={{ color: '#B5BAC1', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            {isAuthenticated ? 'AniList Member' : 'Guest'}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <button
                            onClick={() => setShowProfileModal(false)}
                            style={{
                                padding: '0.75rem',
                                background: colors.pastelPurple,
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* CSS Animation for loading state */}
            <style>{`
                @keyframes pulse {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default Sidebar;
