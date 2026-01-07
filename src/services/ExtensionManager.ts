/**
 * ====================================================================
 * EXTENSION MANAGER
 * ====================================================================
 *
 * Manages all available manga sources.
 * Think of this as the "plugin registry" for the app.
 * 
 * Now supports dynamic extension loading from external repositories.
 * ====================================================================
 */

import { MangaSource } from './sources/Source';
import { ExtensionLoader } from './extensions/loader';

class ExtensionManagerClass {
    private sources: Map<string, MangaSource> = new Map();
    private initialized: boolean = false;

    /**
     * Initialize the extension manager - must be called before using sources
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('[ExtensionManager] Initializing...');

        // Initialize the loader (loads extensions from storage)
        await ExtensionLoader.initialize();

        // Register all loaded extensions
        const extensions = ExtensionLoader.getExtensions();
        extensions.forEach(ext => this.registerSource(ext));

        this.initialized = true;
        console.log(`[ExtensionManager] Ready with ${this.sources.size} sources`);
    }

    /**
     * Register a source with the manager.
     */
    registerSource(source: MangaSource): void {
        if (this.sources.has(source.id)) {
            console.warn(`Source with id '${source.id}' already registered. Skipping.`);
            return;
        }
        this.sources.set(source.id, source);
        console.log(`[ExtensionManager] Registered source: ${source.name}`);
    }

    /**
     * Unregister a source.
     */
    unregisterSource(id: string): boolean {
        const deleted = this.sources.delete(id);
        if (deleted) {
            console.log(`[ExtensionManager] Unregistered source: ${id}`);
        }
        return deleted;
    }

    /**
     * Reload all extensions from storage
     */
    async reload(): Promise<void> {
        console.log('[ExtensionManager] Reloading extensions...');
        this.sources.clear();
        this.initialized = false;
        await ExtensionLoader.reload();

        const extensions = ExtensionLoader.getExtensions();
        extensions.forEach(ext => this.registerSource(ext));

        this.initialized = true;
        console.log(`[ExtensionManager] Reloaded with ${this.sources.size} sources`);
    }

    /**
     * Get a source by its ID.
     */
    getSource(id: string): MangaSource | undefined {
        return this.sources.get(id);
    }

    /**
     * Get all registered sources.
     */
    getAllSources(): MangaSource[] {
        return Array.from(this.sources.values());
    }

    /**
     * Get sources by language.
     */
    getSourcesByLang(lang: string): MangaSource[] {
        return this.getAllSources().filter((s) => s.lang === lang);
    }

    /**
     * Check if a source is registered.
     */
    hasSource(id: string): boolean {
        return this.sources.has(id);
    }

    /**
     * Check if manager is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Singleton instance
export const ExtensionManager = new ExtensionManagerClass();

// Re-export types for convenience
export type { MangaSource, Manga, Chapter, Page, SearchFilter, SearchResult } from './sources/Source';
