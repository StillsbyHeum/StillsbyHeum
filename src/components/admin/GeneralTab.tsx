import React from 'react';
import { Upload } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const GeneralTab: React.FC = () => {
    const { content, updateContent } = useAppContext();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => callback(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h3 className="font-bold text-lg mb-4">Hero Section Text</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">Title (EN)</label>
                        <input className="w-full p-3 border rounded-xl" value={content.heroTitle.en} onChange={e => updateContent('heroTitle', 'en', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">Title (KO)</label>
                        <input className="w-full p-3 border rounded-xl" value={content.heroTitle.ko} onChange={e => updateContent('heroTitle', 'ko', e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">Subtitle (EN)</label>
                        <input className="w-full p-3 border rounded-xl" value={content.heroSubtitle.en} onChange={e => updateContent('heroSubtitle', 'en', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">Subtitle (KO)</label>
                        <input className="w-full p-3 border rounded-xl" value={content.heroSubtitle.ko} onChange={e => updateContent('heroSubtitle', 'ko', e.target.value)} />
                    </div>
                </div>
            </div>
            <div>
                <h3 className="font-bold text-lg mb-4">Artist Section</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">Photo</label>
                        <div className="flex items-center gap-4">
                            <img src={content.artistPhoto} className="w-20 h-20 object-cover rounded-xl bg-stone-100" alt="Artist" />
                            <label className="cursor-pointer px-4 py-2 bg-stone-100 rounded-xl hover:bg-stone-200 font-bold text-xs flex items-center gap-2">
                                <Upload size={14} /> Upload Photo
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, (url) => updateContent('artistPhoto', '', url))} />
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-stone-500 block mb-1">Greeting (EN)</label>
                            <textarea className="w-full p-3 border rounded-xl h-24" value={content.artistGreeting.en} onChange={e => updateContent('artistGreeting', 'en', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-500 block mb-1">Greeting (KO)</label>
                            <textarea className="w-full p-3 border rounded-xl h-24" value={content.artistGreeting.ko} onChange={e => updateContent('artistGreeting', 'ko', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="font-bold text-lg mb-4">AI Context</h3>
                <textarea className="w-full p-4 border rounded-xl h-40 font-mono text-xs" value={content.aiContext} onChange={e => updateContent('aiContext', '', e.target.value)} />
            </div>
        </div>
    );
};

export default GeneralTab;
