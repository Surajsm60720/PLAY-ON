import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchPublicUser } from '../api/anilistClient';

// Use this username to fetch public data
const ANILIST_USERNAME = 'MemestaVedas';

interface UserProfile {
    id: number;
    name: string;
    avatar: {
        large: string;
        medium: string;
    };
    bannerImage?: string;
    favorites?: any;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        /**
         * Fetch public profile by username.
         */
        const loadProfile = async () => {
            try {
                setLoading(true);
                const result = await fetchPublicUser(ANILIST_USERNAME);

                if (result.data && result.data.User) {
                    // Success! Update our profile state with public data
                    setUser(result.data.User);
                    setError(null);
                } else {
                    throw new Error('User not found on AniList');
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError('Failed to fetch AniList profile');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const value = {
        isAuthenticated: !!user,
        user,
        loading,
        error
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
