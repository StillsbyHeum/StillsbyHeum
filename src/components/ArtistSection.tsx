import React from 'react';
import { useAppContext } from '../context/AppContext';
import { EditableText, EditableImage } from './admin/EditableComponents';

const ArtistSection: React.FC = () => {
    const { content, language } = useAppContext();
    return (
        <section className="w-full px-6 py-32 md:py-64 max-w-[1800px] mx-auto" aria-label="About the Artist">
            <div className="flex flex-col md:flex-row gap-12 md:gap-32 items-start">
                <div className="w-full md:w-1/2">
                    <h2 className="text-editorial-h1 mb-8">
                        HEUM
                    </h2>
                    <div className="text-editorial-body max-w-md">
                        <EditableText 
                            section="artistGreeting"
                            field={language}
                            value={content.artistGreeting?.[language] || "Hello, I am Heum. Capturing fleeting moments into eternity."}
                            multiline
                        />
                    </div>
                </div>
                <figure className="w-full md:w-1/2 relative overflow-hidden bg-stone-100 dark:bg-stone-900">
                    <EditableImage 
                        section="artistPhoto"
                        src={content.artistPhoto || "https://images.unsplash.com/photo-1554046920-90dc59f4e7fed?q=80&w=1200&auto=format&fit=crop"} 
                        alt="Portrait of photographer Heum" 
                        className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                    />
                </figure>
            </div>
        </section>
    );
};

export default ArtistSection;
