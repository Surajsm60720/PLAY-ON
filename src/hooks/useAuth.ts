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
}

/**
 * Hook for managing public AniList user state
 * Consumes simplified AuthContext
 * 
 * @returns Public user state
 */
export function useAuth(): UseAuthReturn {
    const { isAuthenticated, user, loading, error } = useAuthContext();

    return {
        isAuthenticated,
        user,
        loading,
        error
    };
}
