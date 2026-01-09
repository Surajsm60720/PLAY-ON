/**
 * Hook for managing AniList notifications
 * - Fetches notifications on mount and every 10 minutes
 * - Sends desktop notifications when new notifications arrive
 * - Only runs when user is authenticated
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { fetchNotifications, AniListNotification } from '../api/anilistClient';
import { sendDesktopNotification } from '../services/notification';

const POLLING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const LAST_SEEN_KEY = 'anilist_last_notification_id';

export interface UseAniListNotificationsReturn {
    notifications: AniListNotification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    markAsRead: () => Promise<void>;
}

/**
 * Get the title for a notification based on its type
 */
function getNotificationTitle(notification: AniListNotification): string {
    const mediaTitle = notification.media?.title?.english || notification.media?.title?.romaji;
    const userName = notification.user?.name;

    switch (notification.type) {
        case 'AIRING':
            return `${mediaTitle} - Episode ${notification.episode}`;
        case 'ACTIVITY_MESSAGE':
            return `Message from ${userName}`;
        case 'ACTIVITY_MENTION':
            return `${userName} mentioned you`;
        case 'FOLLOWING':
            return `${userName} followed you`;
        case 'ACTIVITY_LIKE':
            return `${userName} liked your activity`;
        case 'ACTIVITY_REPLY':
            return `${userName} replied to your activity`;
        case 'THREAD_COMMENT_MENTION':
            return `${userName} mentioned you in a comment`;
        case 'RELATED_MEDIA_ADDITION':
            return `New related media: ${mediaTitle}`;
        case 'MEDIA_DATA_CHANGE':
            return `${mediaTitle} was updated`;
        default:
            return 'New AniList Notification';
    }
}

/**
 * Get the body text for a notification
 */
function getNotificationBody(notification: AniListNotification): string {
    if (notification.context) {
        return notification.context;
    }
    if (notification.contexts && notification.contexts.length > 0) {
        return notification.contexts.join(' ');
    }
    return 'You have a new notification on AniList';
}

/**
 * Get the icon URL for a notification
 */
function getNotificationIcon(notification: AniListNotification): string | undefined {
    return notification.media?.coverImage?.medium || notification.user?.avatar?.medium;
}

export function useAniListNotifications(): UseAniListNotificationsReturn {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<AniListNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastSeenIdRef = useRef<number>(0);
    const isInitialFetchRef = useRef(true);

    // Load last seen notification ID from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(LAST_SEEN_KEY);
        if (stored) {
            lastSeenIdRef.current = parseInt(stored, 10);
        }
    }, []);

    const fetchAndNotify = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetchNotifications(1, 20);
            setNotifications(response.notifications);
            setUnreadCount(response.unreadCount);

            // Check for new notifications (only send desktop notifications after initial fetch)
            if (!isInitialFetchRef.current && response.notifications.length > 0) {
                const newNotifications = response.notifications.filter(
                    (n) => n.id > lastSeenIdRef.current
                );

                // Send desktop notification for each new notification (limit to 3 to avoid spam)
                const notificationsToShow = newNotifications.slice(0, 3);
                for (const notification of notificationsToShow) {
                    sendDesktopNotification(
                        getNotificationTitle(notification),
                        getNotificationBody(notification),
                        getNotificationIcon(notification)
                    );
                }

                // If there are more than 3 new notifications, show a summary
                if (newNotifications.length > 3) {
                    sendDesktopNotification(
                        'AniList Notifications',
                        `You have ${newNotifications.length} new notifications`,
                        undefined
                    );
                }
            }

            // Update last seen ID
            if (response.notifications.length > 0) {
                const maxId = Math.max(...response.notifications.map((n) => n.id));
                if (maxId > lastSeenIdRef.current) {
                    lastSeenIdRef.current = maxId;
                    localStorage.setItem(LAST_SEEN_KEY, String(maxId));
                }
            }

            isInitialFetchRef.current = false;
        } catch (err) {
            console.error('[useAniListNotifications] Failed to fetch notifications:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial fetch and polling
    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Initial fetch
        fetchAndNotify();

        // Set up polling
        const intervalId = setInterval(fetchAndNotify, POLLING_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [isAuthenticated, fetchAndNotify]);

    const markAsRead = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            await import('../api/anilistClient').then(m => m.markNotificationsAsRead());
            setUnreadCount(0);
        } catch (error) {
            console.error('[useAniListNotifications] Failed to mark as read:', error);
        }
    }, [isAuthenticated]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refetch: fetchAndNotify,
        markAsRead
    };
}
