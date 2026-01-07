import { MangaSource } from '../sources/Source';

/**
 * Interface that all dynamic extensions must implement.
 * This mirrors the internal MangaSource interface but is designed for external consumption.
 */
export interface Extension extends MangaSource {
    /** Unique identifier for the extension (e.g., "weebcentral") */
    id: string;
    /** Display name (e.g., "WeebCentral") */
    name: string;
    /** Version string (e.g., "1.0.0") */
    version: string;
    /** Base URL of the source */
    baseUrl: string;
    /** Language code (e.g., "en") */
    lang: string;
}

/**
 * Helper to define an extension - useful for type checking in development.
 */
export function defineExtension(ext: Extension): Extension {
    return ext;
}

// ============================================================================
// EXTENSION REPOSITORY TYPES
// ============================================================================

/**
 * Metadata for an extension as listed in a repository index.
 */
export interface ExtensionMeta {
    id: string;
    name: string;
    version: string;
    lang: string;
    nsfw: boolean;
    iconUrl?: string;
    /** URL to download the JS bundle */
    bundleUrl: string;
    /** Optional description */
    description?: string;
}

/**
 * Repository index format (index.json)
 */
export interface RepositoryIndex {
    name: string;
    description?: string;
    extensions: ExtensionMeta[];
}

/**
 * Installed extension stored in localStorage
 */
export interface InstalledExtension {
    id: string;
    name: string;
    version: string;
    lang: string;
    nsfw: boolean;
    iconUrl?: string;
    /** The repository URL this extension was installed from */
    repoUrl: string;
    /** The bundled JavaScript code */
    bundleCode: string;
    /** Whether this extension is enabled */
    enabled: boolean;
    /** Installation timestamp */
    installedAt: number;
}

/**
 * Repository entry stored in localStorage
 */
export interface ExtensionRepo {
    url: string;
    name: string;
    addedAt: number;
}
