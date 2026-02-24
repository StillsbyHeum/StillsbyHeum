import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue, useMotionValue } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import ImageWithLike from './ImageWithLike';

// [System Architecture Protocol]
// Configuration for 3D Cover Flow & Focus Effects
const CONFIG = {
    PERSPECTIVE: 1000,
    // Mobile Cover Flow Config
    MOBILE: {
        ITEM_WIDTH: 280,   // Width of card in px
        GAP: 20,           // Gap between cards
        ROTATE_Y: 45,      // Max rotation (deg)
        TRANSLATE_Z: 150,  // Pop-out distance (px)
        DEPTH: -100,       // Recede distance for side items
        OPACITY_SIDE: 0.6,
        BLUR_SIDE: 5       // px
    },
    // Desktop Vertical Focus Config
    DESKTOP: {
        Z_RANGE: { CENTER: 100, EDGE: -100 },
        SCALE_RANGE: { CENTER: 1.1, EDGE: 0.9 },
        BLUR_STRENGTH: 8,
        GRAYSCALE_STRENGTH: 50
    }
};

const GridPortfolio: React.FC = () => {
    const { content } = useAppContext();
    const displayImages = content.homePortfolioImages && content.homePortfolioImages.length > 0 
        ? content.homePortfolioImages 
        : content.portfolio.flatMap(album => album.images);
    
    const shuffled = [...displayImages].sort(() => Math.random() - 0.5);

    return (
        <section 
            className="w-full py-20 md:py-32 min-h-screen bg-gradient-to-b from-stone-50 to-stone-200 dark:from-stone-950 dark:to-stone-900 transition-colors duration-500 overflow-hidden"
            aria-label="3D Portfolio"
        >
            {/* Mobile View: Horizontal 3D Cover Flow */}
            <div className="md:hidden w-full h-[80vh] flex items-center">
                <MobileCoverFlow images={shuffled} />
            </div>

            {/* Desktop View: Vertical 3D Focus Grid */}
            <div 
                className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 max-w-[1600px] mx-auto px-4"
                style={{ perspective: `${CONFIG.PERSPECTIVE}px` }}
            >
                {shuffled.map((src, i) => (
                    <DesktopFocusItem key={i} src={src} index={i} />
                ))}
            </div>
        </section>
    );
};

// [Mobile Component] Horizontal 3D Cover Flow
const MobileCoverFlow: React.FC<{ images: string[] }> = ({ images }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollXProgress } = useScroll({ container: containerRef });

    return (
        <div 
            ref={containerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-[50vw] py-10 w-full h-full items-center scrollbar-hide"
            style={{ 
                perspective: `${CONFIG.PERSPECTIVE}px`,
                transformStyle: 'preserve-3d'
            }}
        >
            {images.map((src, i) => (
                <MobileCoverFlowItem 
                    key={i} 
                    src={src} 
                    index={i} 
                    total={images.length}
                    scrollXProgress={scrollXProgress} 
                />
            ))}
        </div>
    );
};

const MobileCoverFlowItem: React.FC<{ 
    src: string; 
    index: number; 
    total: number;
    scrollXProgress: MotionValue<number>; 
}> = ({ src, index, total, scrollXProgress }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    
    const itemWidth = CONFIG.MOBILE.ITEM_WIDTH;
    
    // Calculate the normalized position of this item (0 to 1)
    const normalizedPosition = index / Math.max(1, total - 1);
    
    // Calculate distance from center based on scroll progress
    const distance = useTransform(scrollXProgress, (progress) => {
        return (progress - normalizedPosition) * 2; // -2 to 2 range roughly
    });

    const rotateY = useTransform(distance, 
        [-1, 0, 1], 
        [CONFIG.MOBILE.ROTATE_Y, 0, -CONFIG.MOBILE.ROTATE_Y]
    );

    const translateZ = useTransform(distance,
        [-1, 0, 1],
        [CONFIG.MOBILE.DEPTH, CONFIG.MOBILE.TRANSLATE_Z, CONFIG.MOBILE.DEPTH]
    );

    const opacity = useTransform(distance,
        [-1, 0, 1],
        [CONFIG.MOBILE.OPACITY_SIDE, 1, CONFIG.MOBILE.OPACITY_SIDE]
    );

    const blur = useTransform(distance,
        [-1, 0, 1],
        [CONFIG.MOBILE.BLUR_SIDE, 0, CONFIG.MOBILE.BLUR_SIDE]
    );

    const grayscale = useTransform(distance,
        [-1, 0, 1],
        [1, 0, 1]
    );

    return (
        <motion.div
            ref={itemRef}
            className="relative shrink-0 snap-center rounded-2xl overflow-hidden bg-white dark:bg-stone-800 shadow-xl"
            style={{
                width: itemWidth,
                height: itemWidth * 1.4, // Portrait aspect ratio
                rotateY,
                z: translateZ,
                opacity,
                filter: useTransform([blur, grayscale], ([b, g]) => `blur(${b}px) grayscale(${g})`),
                transformStyle: 'preserve-3d'
            }}
        >
            <ImageWithLike src={src} className="w-full h-full object-cover" />
        </motion.div>
    );
};

// [Desktop Component] Vertical 3D Focus Item (Refined)
const DesktopFocusItem: React.FC<{ src: string; index: number }> = ({ src, index }) => {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const z = useTransform(scrollYProgress, [0, 0.5, 1], [CONFIG.DESKTOP.Z_RANGE.EDGE, CONFIG.DESKTOP.Z_RANGE.CENTER, CONFIG.DESKTOP.Z_RANGE.EDGE]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [CONFIG.DESKTOP.SCALE_RANGE.EDGE, CONFIG.DESKTOP.SCALE_RANGE.CENTER, CONFIG.DESKTOP.SCALE_RANGE.EDGE]);
    const blur = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [CONFIG.DESKTOP.BLUR_STRENGTH, 0, CONFIG.DESKTOP.BLUR_STRENGTH]);
    const grayscale = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [CONFIG.DESKTOP.GRAYSCALE_STRENGTH, 0, CONFIG.DESKTOP.GRAYSCALE_STRENGTH]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.6, 0.8, 1, 0.8, 0.6]);

    return (
        <motion.figure
            ref={ref}
            style={{
                z,
                scale,
                opacity,
                filter: useTransform([blur, grayscale], ([b, g]) => `blur(${b}px) grayscale(${g}%)`)
            }}
            className="w-full aspect-[3/4] m-0 relative will-change-transform preserve-3d"
        >
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-stone-800 ring-1 ring-black/5 dark:ring-white/10">
                 <ImageWithLike src={src} className="w-full h-full object-cover" />
            </div>
        </motion.figure>
    );
}

export default GridPortfolio;
