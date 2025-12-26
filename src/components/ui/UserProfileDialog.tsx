import React from 'react';
import colors from '../../styles/colors';

interface UserProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    isAuthenticated: boolean;
}

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
    isOpen,
    onClose,
    user,
    isAuthenticated
}) => {
    if (!isOpen) return null;

    const handleViewOnAniList = () => {
        if (user?.name) {
            window.open(`https://anilist.co/user/${user.name}`, '_blank');
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                left: '10px',
                bottom: '85px',
                width: '220px',
                background: '#1E1F22',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                padding: '1.25rem',
                zIndex: 1000,
                border: '1px solid #313338',
                animation: 'slideUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}>
                    <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.1rem' }}>User Profile</h3>
                    <button
                        onClick={onClose}
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
                            <img
                                src={user.avatar.large}
                                alt={user?.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
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
                        onClick={handleViewOnAniList}
                        disabled={!user?.name}
                        style={{
                            padding: '0.75rem',
                            background: colors.pastelPurple,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            opacity: user?.name ? 1 : 0.5,
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (user?.name) e.currentTarget.style.background = '#9d9dbf';
                        }}
                        onMouseLeave={(e) => {
                            if (user?.name) e.currentTarget.style.background = colors.pastelPurple;
                        }}
                    >
                        View in AniList
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default UserProfileDialog;
