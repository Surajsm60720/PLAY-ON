/**
 * Theme Type Definitions
 * 
 * This file defines the structure for all themeable properties in the application.
 * When creating a new theme, ensure all these CSS custom properties are defined.
 */

export interface ThemeColors {
    // === CORE BACKGROUNDS ===
    bgMain: string;
    bgContent: string;
    bgCard: string;
    bgGlass: string;
    bgGlassHover: string;
    bgOverlay: string;

    // === TEXT COLORS ===
    textMain: string;
    textMuted: string;
    textHighlight: string;
    textInverse: string;

    // === ACCENT PALETTE ===
    accentPrimary: string;      // Main accent (Lavender Mist in dark theme)
    accentSecondary: string;    // Secondary accent (Sky Blue)
    accentTertiary: string;     // Tertiary accent (Soft Peach)
    accentSuccess: string;      // Success states (Mint Tonic)
    accentWarning: string;      // Warning states (Star Glow)
    accentDanger: string;       // Danger/error states
    accentInfo: string;         // Info states

    // === BORDERS ===
    borderSubtle: string;
    borderHighlight: string;
    borderAccent: string;

    // === INTERACTIVE STATES ===
    hoverBg: string;
    activeBg: string;
    focusRing: string;
}

export interface ThemeShadows {
    glass: string;
    glow: string;
    elevated: string;
    dropdown: string;
}

export interface ThemeGradients {
    primary: string;
    secondary: string;
    bgMesh: string;
    overlay: string;
}

export interface ThemeSpacing {
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    };
}

export interface Theme {
    name: string;
    isDark: boolean;
    colors: ThemeColors;
    shadows: ThemeShadows;
    gradients: ThemeGradients;
    spacing: ThemeSpacing;
}

/**
 * Available theme names.
 * Add new themes here when created.
 */
export type ThemeName = 'default-dark' | 'light' | 'midnight' | 'sakura';

/**
 * CSS Custom Property names used in theme files.
 * All themes MUST define these properties.
 */
export const THEME_CSS_VARS = {
    // Backgrounds
    bgMain: '--theme-bg-main',
    bgContent: '--theme-bg-content',
    bgCard: '--theme-bg-card',
    bgGlass: '--theme-bg-glass',
    bgGlassHover: '--theme-bg-glass-hover',
    bgOverlay: '--theme-bg-overlay',

    // Text
    textMain: '--theme-text-main',
    textMuted: '--theme-text-muted',
    textHighlight: '--theme-text-highlight',
    textInverse: '--theme-text-inverse',

    // Accents
    accentPrimary: '--theme-accent-primary',
    accentPrimaryRgb: '--theme-accent-primary-rgb',
    accentSecondary: '--theme-accent-secondary',
    accentSecondaryRgb: '--theme-accent-secondary-rgb',
    accentTertiary: '--theme-accent-tertiary',
    accentSuccess: '--theme-accent-success',
    accentSuccessRgb: '--theme-accent-success-rgb',
    accentWarning: '--theme-accent-warning',
    accentDanger: '--theme-accent-danger',
    accentDangerRgb: '--theme-accent-danger-rgb',
    accentInfo: '--theme-accent-info',

    // Borders
    borderSubtle: '--theme-border-subtle',
    borderHighlight: '--theme-border-highlight',
    borderAccent: '--theme-border-accent',

    // Shadows
    shadowGlass: '--theme-shadow-glass',
    shadowGlow: '--theme-shadow-glow',
    shadowElevated: '--theme-shadow-elevated',
    shadowDropdown: '--theme-shadow-dropdown',

    // Gradients
    gradientPrimary: '--theme-gradient-primary',
    gradientSecondary: '--theme-gradient-secondary',
    gradientBgMesh: '--theme-gradient-bg-mesh',
    gradientOverlay: '--theme-gradient-overlay',

    // Interactive
    hoverBg: '--theme-hover-bg',
    activeBg: '--theme-active-bg',
    focusRing: '--theme-focus-ring',

    // Scrollbar
    scrollbarThumb: '--theme-scrollbar-thumb',
    scrollbarThumbHover: '--theme-scrollbar-thumb-hover',
    scrollbarTrack: '--theme-scrollbar-track',
} as const;

export default Theme;
