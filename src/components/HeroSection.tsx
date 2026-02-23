import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-[60vh] w-full overflow-hidden bg-white flex items-center justify-center">
        <h1 className="flex items-baseline justify-center gap-2 tracking-tighter animate-fade-in-slow px-4 w-full max-w-full flex-wrap">
            <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-outfit text-stone-900">STILLS</span>
            <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light font-outfit text-stone-900">by</span>
            <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-outfit text-stone-900">HEUM</span>
        </h1>
    </section>
  );
};

export default HeroSection;
