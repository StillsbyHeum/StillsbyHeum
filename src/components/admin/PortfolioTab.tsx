import React, { useState } from 'react';
import { Plus, Trash2, Home, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const PortfolioTab: React.FC = () => {
    const { content, updateContent } = useAppContext();
    const [activeSection, setActiveSection] = useState<'albums' | 'home'>('albums');

    const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (urls: string[]) => void) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls: string[] = [];
            let processed = 0;
            if (files.length === 0) return;
            
            files.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        urls.push(reader.result);
                    }
                    processed++;
                    if (processed === files.length) callback(urls);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const toggleHomeImage = (imgUrl: string) => {
        const currentHomeImages = content.homePortfolioImages || [];
        let newHomeImages;
        if (currentHomeImages.includes(imgUrl)) {
            newHomeImages = currentHomeImages.filter(url => url !== imgUrl);
        } else {
            newHomeImages = [...currentHomeImages, imgUrl];
        }
        updateContent('homePortfolioImages', '', newHomeImages);
    };

    return (
        <div className="space-y-8">
            <div className="flex gap-4 border-b border-stone-200 pb-4">
                <button 
                    onClick={() => setActiveSection('albums')}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeSection === 'albums' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                    Albums Management
                </button>
                <button 
                    onClick={() => setActiveSection('home')}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeSection === 'home' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                    Home Page Selection
                </button>
            </div>

            {activeSection === 'home' ? (
                <div className="space-y-6">
                    <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
                        <h3 className="font-bold text-xl mb-2">Home Page Portfolio</h3>
                        <p className="text-stone-500 text-sm mb-4">Select images from albums below to display on the home page grid. Selected images will appear with a green border.</p>
                        <div className="flex gap-2 text-sm font-bold">
                            <span className="text-green-600">{content.homePortfolioImages?.length || 0} images selected</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {content.portfolio.map((album) => (
                            <div key={album.id} className="border border-stone-200 p-6 rounded-2xl">
                                <h4 className="font-bold text-lg mb-4">{album.title.en}</h4>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {album.images.map((img, imgIdx) => {
                                        const isSelected = content.homePortfolioImages?.includes(img);
                                        return (
                                            <div 
                                                key={imgIdx} 
                                                className={`relative group aspect-[3/4] cursor-pointer transition-all ${isSelected ? 'ring-4 ring-green-500 scale-95' : 'hover:opacity-80'}`}
                                                onClick={() => toggleHomeImage(img)}
                                            >
                                                <img src={img} className="w-full h-full object-cover rounded-lg" alt="Portfolio" />
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {content.portfolio.map((album, idx) => (
                        <div key={album.id} className="border border-stone-200 p-6 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-xl">{album.title.en}</h4>
                                <label className="cursor-pointer px-4 py-2 bg-black text-white rounded-xl font-bold text-xs hover:scale-105 transition-transform flex items-center gap-2">
                                    <Plus size={14} /> Add Images
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleMultipleFileUpload(e, (urls) => {
                                        const newPortfolio = [...content.portfolio];
                                        newPortfolio[idx].images = [...newPortfolio[idx].images, ...urls];
                                        updateContent('portfolio', '', newPortfolio);
                                    })} />
                                </label>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                {album.images.map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative group aspect-[3/4]">
                                        <img src={img} className="w-full h-full object-cover rounded-xl" alt="Portfolio" />
                                        <button 
                                            onClick={() => {
                                                const newPortfolio = [...content.portfolio];
                                                newPortfolio[idx].images = newPortfolio[idx].images.filter((_, i) => i !== imgIdx);
                                                updateContent('portfolio', '', newPortfolio);
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PortfolioTab;
