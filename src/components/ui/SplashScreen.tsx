import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../../assets/logo.png';
import SplitText from './SplitText';

interface SplashScreenProps {
    onComplete: () => void;
    minDuration?: number;
}

/**
 * Animated Splash Screen Component
 * Shows on app startup with split screen design
 * Left: SplitText animation
 * Right: Logo animation
 */
function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [textComplete, setTextComplete] = useState(false);

    useEffect(() => {
        // Minimum display time for splash screen
        const timer = setTimeout(() => {
            if (textComplete) {
                setIsExiting(true);
            }
        }, minDuration);

        return () => clearTimeout(timer);
    }, [minDuration, textComplete]);

    // Trigger exit when text animation is done AND min duration is passed
    useEffect(() => {
        if (textComplete) {
            const timer = setTimeout(() => {
                setIsExiting(true);
            }, 500); // Small buffer after text completes
            return () => clearTimeout(timer);
        }
    }, [textComplete]);

    const handleAnimationComplete = () => {
        if (isExiting) {
            onComplete();
        }
    };

    const handleTextComplete = () => {
        console.log('All letters have animated!');
        setTextComplete(true);
    };

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    onAnimationComplete={handleAnimationComplete}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column', // Vertical layout
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Use main app background color
                        backgroundColor: 'var(--color-bg-main)',
                        zIndex: 99999,
                        overflow: 'hidden',
                    }}
                >
                    {/* TOP SIDE: Logo Animation */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flexDirection: 'column',
                        width: '100%',
                        paddingBottom: '2rem',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', // Top to bottom gradient
                        borderBottom: '1px solid var(--color-border-subtle)',
                    }}>
                        <motion.img
                            src={logo}
                            alt="PLAY-ON!"
                            initial={{ scale: 0, rotate: -180, opacity: 0 }}
                            animate={{
                                scale: 1,
                                rotate: 0,
                                opacity: 1
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 260,
                                damping: 20,
                                duration: 1.2,
                                delay: 0.2
                            }}
                            style={{
                                width: '200px', // Slightly smaller for vertical layout
                                height: '200px',
                                filter: 'drop-shadow(0 0 30px rgba(180, 162, 246, 0.4))', // Lavender glow
                                marginBottom: '2rem'
                            }}
                        />
                    </div>

                    {/* BOTTOM SIDE: SplitText */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        width: '100%',
                        paddingTop: '3rem',
                    }}>
                        <SplitText
                            text="PLAY-ON!"
                            // Added p-4 (all sides) and leading-normal to prevent clipping
                            className="text-8xl font-black text-center font-planet p-4 leading-normal"
                            delay={100}
                            duration={0.6}
                            ease="power3.out"
                            splitType="chars"
                            from={{ opacity: 0, y: 40 }}
                            to={{ opacity: 1, y: 0 }}
                            threshold={0.1}
                            rootMargin="-100px"
                            textAlign="center"
                            onLetterAnimationComplete={handleTextComplete}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default SplashScreen;
