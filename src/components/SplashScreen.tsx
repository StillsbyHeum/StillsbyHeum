import React, { useEffect } from 'react';

const SplashScreen: React.FC<{ onFinish: () => void; isFinishing: boolean }> = ({ onFinish, isFinishing }) => {
    useEffect(() => { const timer = setTimeout(() => onFinish(), 2200); return () => clearTimeout(timer); }, [onFinish]);
    return (
        <div className={`fixed inset-0 z-[99999] bg-white flex items-center justify-center transition-opacity duration-1000 ${isFinishing ? 'pointer-events-none' : ''}`}>
             <h1 className={`flex items-baseline gap-1 tracking-tighter ${isFinishing ? 'animate-disperse' : ''}`}>
                <span className="text-4xl md:text-6xl font-black font-outfit text-stone-900">STILLS</span>
                <span className="text-4xl md:text-6xl font-light font-outfit text-stone-900">by</span>
                <span className="text-4xl md:text-6xl font-black font-outfit text-stone-900">HEUM</span>
            </h1>
        </div>
    );
};

export default SplashScreen;
