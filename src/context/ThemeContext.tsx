import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AVAILABLE_THEMES } from '../themes';

type ThemeId = typeof AVAILABLE_THEMES[number]['id'];

interface ThemeContextType {
    /** Current theme ID */
    theme: ThemeId;
    /** Set the active theme */
    setTheme: (themeId: ThemeId) => void;
    /** Toggle between dark and light themes */
    toggleTheme: () => void;
    /** Whether current theme is dark mode */
    isDark: boolean;
    /** List of available themes */
    availableThemes: typeof AVAILABLE_THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'playon-theme';
const DEFAULT_THEME: ThemeId = 'default-dark';

/**
 * Apply theme to the document
 */
function applyTheme(themeId: ThemeId): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const isDark = themeId.includes('dark') || themeId === 'default-dark';
    const themeColor = isDark ? '#0c0c0e' : '#f5f5f7';

    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', themeColor);
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeId>(() => {
        // Get initial theme from localStorage or system preference
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
        if (stored && AVAILABLE_THEMES.some(t => t.id === stored)) {
            return stored;
        }
        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return DEFAULT_THEME;
    });

    const isDark = theme.includes('dark') || theme === 'default-dark';

    // Apply theme on mount and when it changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // Only auto-switch if user hasn't explicitly set a preference
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                setThemeState(e.matches ? 'default-dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const setTheme = useCallback((themeId: ThemeId) => {
        setThemeState(themeId);
        localStorage.setItem(STORAGE_KEY, themeId);
    }, []);

    const toggleTheme = useCallback(() => {
        const newTheme: ThemeId = isDark ? 'light' : 'default-dark';
        setTheme(newTheme);
    }, [isDark, setTheme]);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
                toggleTheme,
                isDark,
                availableThemes: AVAILABLE_THEMES
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
