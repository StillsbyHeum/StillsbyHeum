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
        <div className="min-h-screen pt-40 px-6 pb-32 max-w-[1800px] mx-auto font-sans">
            <div className="mb-40">
                <h2 className="text-huge">REVIEWS</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-32">
                {reviews.map(r => (
                    <div key={r.id} onClick={() => setSelectedReview(r)} className="border-t border-black/10 dark:border-white/10 pt-6 group cursor-pointer">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <EditableText 
                                    value={r.author} 
                                    onSave={(val) => updateReview(r.id, { author: val })}
                                    className="text-editorial-h3"
                                    as="span"
                                />
                                <div className="flex text-black dark:text-white mt-2 gap-1">
                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                            </div>
                            <span className="text-editorial-micro text-black/50 dark:text-white/50">{r.date}</span>
                        </div>
                        <div className="text-editorial-body text-black/70 dark:text-white/70 mb-8 line-clamp-4 group-hover:opacity-50 transition-opacity">
                            <EditableText 
                                value={r.content} 
                                onSave={(val) => updateReview(r.id, { content: val })}
                                multiline
                            />
                        </div>
                        {r.photos && r.photos.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                {r.photos.map((p, i) => <img key={i} src={p} className="w-24 h-24 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Review" />)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-center pb-12 relative z-10">
                <button ref={buttonRef} onClick={() => setIsWriting(true)} className="text-editorial-h3 border-b border-black dark:border-white pb-1 hover:opacity-50 transition-opacity" aria-label="Write a review">
                    WRITE A REVIEW
                </button>
            </div>

            <AnimatePresence>
                {selectedReview && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setSelectedReview(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#050505] w-full max-w-4xl max-h-[90vh] border border-black/10 dark:border-white/10 flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-black/10 dark:border-white/10 flex justify-between items-center sticky top-0 z-10 bg-white dark:bg-[#050505]">
                                <div>
                                    <h3 className="text-editorial-h2">{selectedReview.author}</h3>
                                    <div className="flex text-black dark:text-white gap-1 mt-2">
                                        {[...Array(selectedReview.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReview(null)} className="text-editorial-micro hover:opacity-50 transition-opacity">
                                    CLOSE
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto p-8 space-y-12">
                                {selectedReview.photos && selectedReview.photos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {selectedReview.photos.map((p, i) => (
                                            <img key={i} src={p} className="w-full aspect-square object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Review Detail" />
                                        ))}
                                    </div>
                                )}
                                <div>
                                    <p className="text-editorial-body text-black/80 dark:text-white/80 whitespace-pre-line">{selectedReview.content}</p>
                                    <p className="text-left text-editorial-micro text-black/50 dark:text-white/50 mt-8">{selectedReview.date}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                
                {isWriting && createPortal(
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => setIsWriting(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#050505] w-full max-w-2xl border border-black/10 dark:border-white/10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-12 border-b border-black/10 dark:border-white/10 pb-4">
                                <h3 className="text-editorial-h2">{t('WRITE A REVIEW', '리뷰 작성')}</h3>
                                <button onClick={() => setIsWriting(false)} className="text-editorial-micro hover:opacity-50 transition-opacity">CLOSE</button>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-editorial-micro mb-2">{t('NAME', '이름')}</label>
                                    <input 
                                        value={newReview.author} 
                                        onChange={e => setNewReview({...newReview, author: e.target.value})}
                                        className="w-full p-4 bg-transparent border border-black/20 dark:border-white/20 text-editorial-body outline-none focus:border-black dark:focus:border-white transition-colors"
                                        placeholder={t('YOUR NAME', '이름을 입력하세요')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-editorial-micro mb-2">{t('RATING', '별점')}</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`${star <= newReview.rating ? 'text-black dark:text-white' : 'text-black/20 dark:text-white/20'} hover:opacity-50 transition-opacity`}>
                                                <Star size={32} fill="currentColor" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-editorial-micro mb-2">{t('REVIEW', '내용')}</label>
                                    <textarea 
                                        value={newReview.content} 
                                        onChange={e => setNewReview({...newReview, content: e.target.value})}
                                        className="w-full p-4 bg-transparent border border-black/20 dark:border-white/20 text-editorial-body outline-none focus:border-black dark:focus:border-white h-32 resize-none transition-colors"
                                        placeholder={t('SHARE YOUR EXPERIENCE...', '경험을 공유해주세요...')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-editorial-micro mb-2">{t('PHOTOS', '사진')}</label>
                                    <div className="flex flex-wrap gap-4">
                                        {newReview.photos && newReview.photos.map((p, i) => (
                                            <div key={i} className="relative w-24 h-24 overflow-hidden group border border-black/10 dark:border-white/10">
                                                <img src={p} className="w-full h-full object-cover grayscale" alt="Preview" />
                                                <button onClick={() => setNewReview({...newReview, photos: newReview.photos?.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-black text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CloseIcon size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-24 h-24 border border-dashed border-black/30 dark:border-white/30 flex items-center justify-center cursor-pointer hover:border-black dark:hover:border-white transition-colors">
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
                                            <Plus size={24} className="text-black/50 dark:text-white/50" />
                                        </label>
                                    </div>
                                </div>
                                <button onClick={handleSubmit} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 text-editorial-h3 hover:opacity-80 transition-opacity mt-8">
                                    {t('SUBMIT REVIEW', '리뷰 등록')}
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
