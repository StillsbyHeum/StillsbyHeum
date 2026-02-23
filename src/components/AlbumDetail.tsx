import React from 'react';
import { X as CloseIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AlbumDetail: React.FC = () => {
    const { selectedAlbum, setSelectedAlbum } = useAppContext();
    if (!selectedAlbum) return null;
    return (
        <div className="fixed inset-0 z-[9000] bg-white overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-3xl px-14 py-12 flex justify-between items-center border-b border-stone-100">
                <button onClick={() => setSelectedAlbum(null)} className="p-5 hover:bg-stone-50 rounded-full transition-all active:scale-90"><CloseIcon size={44} /></button>
                <h2 className="font-black text-4xl uppercase tracking-widest font-outfit">{selectedAlbum.title.en}</h2>
                <div className="w-20"></div>
            </div>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-12 px-12 py-24 max-w-screen-2xl mx-auto space-y-12">
                {selectedAlbum.images.map((img, idx) => (
                    <img key={idx} src={img} className="w-full rounded-[4rem] hover:opacity-95 transition-all shadow-2xl cursor-zoom-in hover:scale-[1.04] duration-1000" alt={`Portfolio ${idx}`} />
                ))}
            </div>
        </div>
    );
};

export default AlbumDetail;
