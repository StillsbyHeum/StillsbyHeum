import React from 'react';
import { useAppContext } from '../context/AppContext';
import { PortfolioAlbum } from '../types';

const PortfolioStrip: React.FC<{ album: PortfolioAlbum, duration: number }> = ({ album, duration }) => {
    const { setSelectedAlbum } = useAppContext();
    const displayImages = [...album.images, ...album.images].slice(0, 15); 
    return (
        <div className="relative w-full py-8 overflow-hidden bg-white border-b border-stone-100 group">
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-6">
                <div className="pointer-events-auto cursor-pointer flex justify-center" onClick={() => setSelectedAlbum(album)}>
                    {/* Added text-center to h3 to ensure alignment for wrapped text like "Event & Graduation" */}
                    <h3 className="text-6xl md:text-[10rem] font-black font-outfit text-white relative z-50 tracking-tighter uppercase drop-shadow-2xl hover:scale-110 transition-transform duration-[1500ms] text-center leading-tight">
                         {album.title.en}
                    </h3>
                </div>
            </div>
            <div className="flex gap-8 animate-marquee w-max px-8 items-center" style={{ animationDuration: `${duration}s` }}>
                {displayImages.map((img, idx) => (
                    <div key={`${album.id}-${idx}`} onClick={() => setSelectedAlbum(album)} className="relative shrink-0 rounded-[2rem] overflow-hidden cursor-pointer w-[85vw] h-auto aspect-[3/4] md:w-auto md:h-[70vh] md:aspect-[3/4] shadow-xl hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] transition-all duration-1000">
                        <img src={img} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" alt="Portfolio" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PortfolioStrip;
