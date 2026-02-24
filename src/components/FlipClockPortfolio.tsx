import React from 'react';
import { useAppContext } from '../context/AppContext';
import { EditableImage } from './admin/EditableComponents';

const FlipClockPortfolio: React.FC = () => {
    const { content } = useAppContext();
    
    // Use homePortfolioImages or fallback to portfolio images
    const images = content.homePortfolioImages && content.homePortfolioImages.length > 0 
        ? content.homePortfolioImages 
        : content.portfolio.flatMap(album => album.images).slice(0, 10);

    return (
        <div className="w-full bg-white dark:bg-[#050505]">
            {/* Hero Section - Massive Typography */}
            <div className="h-screen w-full flex items-center justify-center px-6">
                <h1 className="text-huge text-center break-words leading-none">
                    STILLS<br/>BY HEUM
                </h1>
            </div>

            {/* Editorial Grid */}
            <div className="w-full px-6 py-20 max-w-[1800px] mx-auto">
                <div className="flex flex-col gap-32 md:gap-64">
                    {images.map((src, i) => {
                        // Create an editorial layout by varying widths and alignments
                        const isEven = i % 2 === 0;
                        const widthClass = i % 3 === 0 ? 'w-full md:w-[80%]' : i % 3 === 1 ? 'w-[80%] md:w-[50%]' : 'w-[90%] md:w-[60%]';
                        const alignClass = isEven ? 'self-start' : 'self-end';
                        
                        return (
                            <div key={i} className={`flex flex-col ${alignClass} ${widthClass}`}>
                                <div className="overflow-hidden bg-stone-100 dark:bg-stone-900">
                                    <EditableImage 
                                        section="homePortfolioImages"
                                        field={i.toString()}
                                        src={src} 
                                        alt={`Portfolio ${i + 1}`}
                                        className="w-full h-auto object-cover hover:scale-105 transition-transform duration-1000"
                                    />
                                </div>
                                <div className="mt-4 flex justify-between items-start text-editorial-micro text-black/50 dark:text-white/50">
                                    <span>NO. {String(i + 1).padStart(3, '0')}</span>
                                    <span>LONDON, UK</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FlipClockPortfolio;
