/**
 * Custom React Hook for AniList User Profile
 */

import { useAuthContext } from '../context/AuthContext';

interface UseAuthReturn {
    /** Whether user data is loaded */
    isAuthenticated: boolean;
    /** Public user's data */
    user: any;
    /** Loading state */
    loading: boolean;
    /** Error message */
    error: string | null;
    /** Function to initiate login */
    login: () => Promise<void>;
    /** Function to logout */
    logout: () => void;
    /** Function to login with manual code */
    loginWithCode: (code: string) => Promise<void>;
}

/**
 * Hook for managing public AniList user state
 * Consumes simplified AuthContext
 * 
 * @returns Public user state
 */
export function useAuth(): UseAuthReturn {
    const { isAuthenticated, user, loading, error, login, logout, loginWithCode } = useAuthContext();

    return {
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout,
        loginWithCode
    };
}
