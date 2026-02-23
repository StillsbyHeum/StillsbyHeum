import React from 'react';
import { useAppContext } from '../context/AppContext';
import { EditableText, EditableImage } from './admin/EditableComponents';

const ArtistSection: React.FC = () => {
    const { content, language } = useAppContext();
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 w-full" aria-label="About the Artist">
            <figure className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden aspect-[4/5] md:aspect-[21/9] shadow-2xl group">
                <EditableImage 
                    section="artistPhoto"
                    src={content.artistPhoto || "https://images.unsplash.com/photo-1554046920-90dc59f4e7fed?q=80&w=1200&auto=format&fit=crop"} 
                    alt="Portrait of photographer Heum" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <figcaption className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                    <h2 className="text-white text-4xl md:text-6xl font-black mb-4 font-outfit tracking-tighter">HEUM</h2>
                    <div className="text-white/90 text-lg md:text-2xl max-w-2xl font-medium leading-relaxed">
                        <EditableText 
                            section="artistGreeting"
                            field={language}
                            value={content.artistGreeting?.[language] || "Hello, I am Heum. Capturing fleeting moments into eternity."}
                            multiline
                            className="text-white"
                        />
                    </div>
                </figcaption>
            </figure>
        </section>
    );
};

export default ArtistSection;
