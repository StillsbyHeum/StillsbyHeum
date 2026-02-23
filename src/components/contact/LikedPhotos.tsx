import React from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

interface LikedPhotosProps {
    language: 'ko' | 'en';
    onBack: () => void;
    onNext: () => void;
}

const LikedPhotos: React.FC<LikedPhotosProps> = ({
    language,
    onBack,
    onNext
}) => {
    const { likedPhotos, toggleLike } = useAppContext();

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                <h3 className="text-xl font-bold">{language === 'ko' ? '좋아요한 사진 (참고용)' : 'Liked Photos (Reference)'}</h3>
            </div>
            
            {likedPhotos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-4">
                    <p>{language === 'ko' ? '좋아요한 사진이 없습니다.' : 'No liked photos yet.'}</p>
                    <p className="text-xs text-center max-w-xs">{language === 'ko' ? '포트폴리오에서 마음에 드는 사진에 하트를 눌러주세요.' : 'Go back to portfolio and click the heart on photos you like.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[400px] pr-2">
                    {likedPhotos.map((src, idx) => (
                        <div key={idx} className="relative group aspect-[3/4]">
                            <img src={src} className="w-full h-full object-cover rounded-lg" alt="Liked" />
                            <button 
                                onClick={() => toggleLike(src)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-auto pt-6 border-t border-stone-200">
                <button 
                    onClick={onNext}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                >
                    {language === 'ko' ? '다음 단계' : 'Next Step'}
                </button>
            </div>
        </motion.div>
    );
};

export default LikedPhotos;
