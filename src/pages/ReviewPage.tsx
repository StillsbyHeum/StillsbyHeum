import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X as CloseIcon, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Review } from '../types';
import SimpleSmile from '../components/SimpleSmile';
import SimplePlus from '../components/SimplePlus';
import { EditableText } from '../components/admin/EditableComponents';

const ReviewPage: React.FC = () => {
    const { reviews, addReview, updateReview, language } = useAppContext();
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [isWriting, setIsWriting] = useState(false);
    const [newReview, setNewReview] = useState<{ author: string; content: string; rating: number; photos: string[] }>({ author: '', content: '', rating: 5, photos: [] });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [buttonPos, setButtonPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        if (isWriting && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setButtonPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        }
    }, [isWriting]);

    const handleSubmit = () => {
        if (!newReview.author || !newReview.content) return alert(language === 'ko' ? "모든 항목을 입력해주세요" : "Please fill in all fields");
        addReview({
            id: Date.now().toString(),
            author: newReview.author,
            content: newReview.content,
            rating: newReview.rating,
            date: new Date().toISOString().split('T')[0],
            photos: newReview.photos || [],
            email: ""
        });
        setIsWriting(false);
        setNewReview({ author: '', content: '', rating: 5, photos: [] });
    };

    const t = (en: string, ko: string) => language === 'ko' ? ko : en;

    return (
        <div className="min-h-screen pt-32 px-4 pb-32 max-w-6xl mx-auto font-sans">
            <div className="flex justify-center mb-16 px-2">
                <h2 className="text-6xl font-black tracking-tighter uppercase font-outfit text-stone-900 dark:text-stone-100 leading-none text-center">Reviews</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                {reviews.map(r => (
                    <div key={r.id} onClick={() => setSelectedReview(r)} className="p-6 bg-stone-50 dark:bg-stone-900 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-500 border border-white dark:border-stone-800 group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <EditableText 
                                    value={r.author} 
                                    onSave={(val) => updateReview(r.id, { author: val })}
                                    className="font-bold text-base tracking-tight text-stone-900 dark:text-stone-100"
                                    as="span"
                                />
                                <div className="flex text-yellow-500 mt-1 gap-0.5">
                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-stone-400 font-mono tracking-widest">{r.date}</span>
                        </div>
                        <div className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed mb-4 font-medium group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors line-clamp-4">
                            <EditableText 
                                value={r.content} 
                                onSave={(val) => updateReview(r.id, { content: val })}
                                multiline
                            />
                        </div>
                        {r.photos && r.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                {r.photos.map((p, i) => <img key={i} src={p} className="w-16 h-16 object-cover rounded-[0.8rem] shrink-0 shadow-sm hover:scale-105 transition-all" alt="Review" />)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-center pb-12 relative z-10">
                <button ref={buttonRef} onClick={() => setIsWriting(true)} className="relative group hover:scale-110 transition-transform active:scale-95" aria-label="Write a review">
                    <Star size={48} className="text-yellow-400 drop-shadow-xl" fill="currentColor" />
                    <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                        <SimplePlus size={18} className="text-stone-900" />
                    </div>
                </button>
            </div>

            <AnimatePresence>
                {selectedReview && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedReview(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-stone-900 w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-900 sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-xl text-stone-900 dark:text-stone-100">{selectedReview.author}</h3>
                                    <div className="flex text-yellow-500 gap-0.5 mt-1">
                                        {[...Array(selectedReview.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReview(null)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500 dark:text-stone-400">
                                    <CloseIcon size={24} />
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto p-6 space-y-6">
                                {selectedReview.photos && selectedReview.photos.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedReview.photos.map((p, i) => (
                                            <img key={i} src={p} className="w-full aspect-square object-cover rounded-xl shadow-sm" alt="Review Detail" />
                                        ))}
                                    </div>
                                )}
                                <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-2xl">
                                    <p className="text-stone-700 dark:text-stone-300 leading-loose whitespace-pre-line font-medium">{selectedReview.content}</p>
                                    <p className="text-right text-xs font-bold text-stone-400 mt-4 font-mono">{selectedReview.date}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                
                {isWriting && createPortal(
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-[2px]"
                        onClick={() => setIsWriting(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="absolute bg-white dark:bg-stone-900 w-[90vw] max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[70vh] overflow-y-auto"
                            style={{ 
                                left: `50%`,
                                transform: 'translateX(-50%)',
                                bottom: `calc(100vh - ${buttonPos.top}px + 20px)`
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('Write a Review', '리뷰 작성')}</h3>
                                <button onClick={() => setIsWriting(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500 dark:text-stone-400"><CloseIcon size={20} /></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">{t('Name', '이름')}</label>
                                    <input 
                                        value={newReview.author} 
                                        onChange={e => setNewReview({...newReview, author: e.target.value})}
                                        className="w-full p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
                                        placeholder={t('Your Name', '이름을 입력하세요')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">{t('Rating', '별점')}</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`${star <= newReview.rating ? 'text-yellow-400' : 'text-stone-200 dark:text-stone-700'} hover:scale-110 transition-transform`}>
                                                <Star size={28} fill="currentColor" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">{t('Review', '내용')}</label>
                                    <textarea 
                                        value={newReview.content} 
                                        onChange={e => setNewReview({...newReview, content: e.target.value})}
                                        className="w-full p-3 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black dark:focus:ring-white h-24 resize-none transition-all text-sm"
                                        placeholder={t('Share your experience...', '경험을 공유해주세요...')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1 ml-1">{t('Photos', '사진')}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {newReview.photos && newReview.photos.map((p, i) => (
                                            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden group">
                                                <img src={p} className="w-full h-full object-cover" alt="Preview" />
                                                <button onClick={() => setNewReview({...newReview, photos: newReview.photos?.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CloseIcon size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-14 h-14 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                                                if (e.target.files) {
                                                    Array.from(e.target.files).forEach((file: File) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setNewReview(prev => ({ ...prev, photos: [...(prev.photos || []), reader.result as string] }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    });
                                                }
                                            }} />
                                            <Plus size={18} className="text-stone-400" />
                                        </label>
                                    </div>
                                </div>
                                <button onClick={handleSubmit} className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold text-base hover:scale-[1.02] transition-transform shadow-lg mt-2">
                                    {t('Submit Review', '리뷰 등록')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>,
                    document.body
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReviewPage;
