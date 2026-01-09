/**
 * Theme Index
 * 
 * Central export for all theme-related modules.
 * Import themes and utilities from here.
 */

// CSS Theme files - import one of these in your app
import './default-dark.theme.css';
import './light.theme.css';

// Type definitions
export * from './theme.types';
export type { Theme, ThemeName } from './theme.types';

/**
 * List of available themes for UI selectors
 */
export const AVAILABLE_THEMES = [
    { id: 'default-dark', name: 'Dark (Default)', icon: '🌙' },
    { id: 'light', name: 'Light', icon: '☀️' },
] as const;

/**
 * Get theme display name from theme ID
 */
export function getThemeName(themeId: string): string {
    const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
    return theme?.name || themeId;
}
