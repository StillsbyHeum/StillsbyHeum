import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { EditableImage } from './admin/EditableComponents';

const FlipCard: React.FC<{ 
    src: string; 
    index: number; 
    total: number; 
    scrollYProgress: MotionValue<number>;
    section: string;
    field: string;
}> = ({ src, index, total, scrollYProgress, section, field }) => {
    // Calculate the trigger point for this card
    // We want the flip to happen as we scroll past the card's position
    const step = 1 / total;
    const start = index * step;
    const end = start + step;

    // Transform scroll progress into rotation
    // 0 -> 0 degrees (flat)
    // 1 -> -180 degrees (flipped down)
    const rawRotateX = useTransform(scrollYProgress, [start, end], [0, -180]);
    const rotateX = useSpring(rawRotateX, { stiffness: 400, damping: 40 });
    
    // Opacity and brightness adjustments for depth
    const opacity = useTransform(scrollYProgress, [start, end], [1, 0]);
    const brightness = useTransform(scrollYProgress, [start, end], [1, 0.5]);

    // Check if the image is a placeholder (base64 or specific URL)
    const isPlaceholder = src.startsWith("data:image") || src.includes("placeholder");

    return (
        <div className="sticky top-0 h-screen w-full flex items-center justify-center perspective-1000">
            <motion.div 
                style={{ 
                    rotateX,
                    transformOrigin: "bottom center",
                    filter: `brightness(${brightness})`,
                    zIndex: total - index, // Stack order: first card on top
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased'
                }}
                className="relative w-full max-w-4xl aspect-[4/3] md:aspect-[16/9] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden border border-[#EEEEEE] dark:border-stone-800 antialiased"
            >
                <EditableImage 
                    section={section as any}
                    field={field}
                    src={src} 
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover"
                />
                
                {isPlaceholder && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-stone-200 text-2xl md:text-4xl font-light tracking-widest uppercase font-outfit">
                            Ready for Your Masterpiece
                        </span>
                    </div>
                )}

                {/* Glossy overlay for flip effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </motion.div>
        </div>
    );
};

const FlipClockPortfolio: React.FC = () => {
    const { content } = useAppContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Use homePortfolioImages or fallback to white placeholders
    const images = content.homePortfolioImages && content.homePortfolioImages.length > 0 
        ? content.homePortfolioImages 
        : Array(5).fill("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"); // White placeholder

    return (
        <div ref={containerRef} className="relative w-full bg-stone-100 dark:bg-black" style={{ height: `${images.length * 100}vh` }}>
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center px-4 md:px-10 perspective-2000">
                    {images.map((src, i) => (
                        <div key={i} className="absolute inset-0 flex items-center justify-center">
                            <FlipCard 
                                src={src} 
                                index={i} 
                                total={images.length} 
                                scrollYProgress={scrollYProgress}
                                section="homePortfolioImages"
                                field={i.toString()}
                            />
                        </div>
                    ))}
                    
                    {/* Final Card (Static Base) */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="w-full max-w-4xl aspect-[4/3] md:aspect-[16/9] bg-white dark:bg-stone-900 shadow-inner rounded-[2rem] flex items-center justify-center">
                            <h2 className="text-4xl md:text-8xl font-black text-stone-200 dark:text-stone-800 font-outfit tracking-tighter">
                                STILLS
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipClockPortfolio;
