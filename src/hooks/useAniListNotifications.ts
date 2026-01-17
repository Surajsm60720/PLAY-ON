/**
 * Hook for managing AniList notifications
 * - DEPRECATED: Logic moved to NotificationContext
 * - This hook now just exposes the context
 */

import { useNotification } from '../context/NotificationContext';
import { AniListNotification } from '../api/anilistClient';

export interface UseAniListNotificationsReturn {
    notifications: AniListNotification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    markAsRead: () => Promise<void>;
}

export function useAniListNotifications(): UseAniListNotificationsReturn {
    return useNotification();
}
