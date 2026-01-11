import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { exit } from '@tauri-apps/plugin-process';
import { useSettings } from '../../context/SettingsContext';

// Detect if running on macOS
const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Custom Titlebar Component
 * 
 * Replaces the default OS titlebar with a custom one.
 * Includes project title and window controls with premium hover effects.
 * Platform-aware: controls on left for macOS, right for Windows.
 */
function Titlebar() {
    const appWindow = getCurrentWindow();
    const { settings } = useSettings();

    const handleMinimize = async () => { await appWindow.minimize(); };
    const handleMaximize = async () => { await appWindow.toggleMaximize(); };
    const handleClose = async () => {
        if (settings.closeToTray) {
            // Hide to tray instead of closing
            await invoke('hide_window');
        } else {
            // Quit completely
            await exit(0);
        }
    };

    // Button styles
    const buttonStyle = (bg: string) => ({
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: 'none',
        background: bg,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0px',
        padding: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    const createHoverHandlers = (icon: string, glowColor: string) => ({
        onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.fontSize = icon === '◻' ? '8px' : '10px';
            e.currentTarget.textContent = icon;
            e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
            e.currentTarget.style.boxShadow = `0 0 12px 2px ${glowColor}`;
            e.currentTarget.style.transform = 'scale(1.1)';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.fontSize = '0px';
            e.currentTarget.textContent = '';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
        },
    });

    const CloseButton = (
        <button
            onClick={handleClose}
            title="Close"
            style={buttonStyle('#ff6991ff')}
            {...createHoverHandlers('×', 'rgba(255, 105, 105, 0.4)')}
        />
    );

    const MinimizeButton = (
        <button
            onClick={handleMinimize}
            title="Minimize"
            style={buttonStyle('#fbb9dc')}
            {...createHoverHandlers('−', 'rgba(219, 197, 243, 0.4)')}
        />
    );

    const MaximizeButton = (
        <button
            onClick={handleMaximize}
            title="Maximize"
            style={buttonStyle('#6a6a9e')}
            {...createHoverHandlers('◻', 'rgba(133, 255, 161, 0.4)')}
        />
    );

    const AppTitle = (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>
            <span style={{
                fontSize: '0.85rem',
                fontWeight: '800',
                color: 'var(--color-text-main)',
                letterSpacing: '1px',
                textTransform: 'uppercase'
            }}>
                PLAY-ON!
            </span>
        </div>
    );

    const WindowControls = (
        <div style={{
            display: 'flex',
            gap: '8px',
            WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}>
            {isMacOS ? (
                // macOS: Close, Minimize, Maximize (left to right)
                <>{CloseButton}{MinimizeButton}{MaximizeButton}</>
            ) : (
                // Windows: Minimize, Maximize, Close (left to right)
                <>{MinimizeButton}{MaximizeButton}{CloseButton}</>
            )}
        </div>
    );

    return (
        <div
            data-tauri-drag-region
            style={{
                height: '32px',
                background: 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 1rem',
                userSelect: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                WebkitAppRegion: 'drag',
            } as React.CSSProperties}
        >
            {isMacOS ? (
                // macOS: Controls left, title right
                <>{WindowControls}{AppTitle}</>
            ) : (
                // Windows: Title left, controls right
                <>{AppTitle}{WindowControls}</>
            )}
        </div>
    );
}

export default Titlebar;
