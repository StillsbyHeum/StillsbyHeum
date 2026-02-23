import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Calendar as CalendarIcon, Instagram, MessageCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { EditableText } from './admin/EditableComponents';

const Navigation: React.FC<{ isMenuOpen: boolean; setIsMenuOpen: (isOpen: boolean) => void }> = ({ isMenuOpen, setIsMenuOpen }) => {
    const location = useLocation();
    const { content, updateContent, language, setLanguage } = useAppContext();
    const [isRotating, setIsRotating] = useState(false);

    const handleLanguageChange = () => {
        setIsRotating(true);
        setLanguage(language === 'ko' ? 'en' : 'ko');
        setTimeout(() => setIsRotating(false), 500); // Duration of rotation
    };

    const getLabel = (en: string, ko: string) => language === 'ko' ? ko : en;

    // Fallback if menuItems is empty or undefined (e.g. old localStorage data)
    const menuItems = content.menuItems && content.menuItems.length > 0 ? content.menuItems : [
        { id: '/', ko: '홈', en: 'STILLS' },
        { id: '/info', ko: '상품', en: 'PRODUCT' },
        { id: '/reviews', ko: '리뷰', en: 'REVIEW' },
        { id: '/faq', ko: 'FAQ', en: 'FAQ' }
    ];

    const handleMenuUpdate = (index: number, newValue: string) => {
        const newItems = [...menuItems];
        newItems[index] = { ...newItems[index], [language]: newValue };
        updateContent('menuItems', '', newItems);
    };

    return (
        <>
            {/* Main Top Nav - Static Position */}
            <nav className="w-full flex justify-center py-6 px-4 bg-white dark:bg-stone-950 z-[50]">
                <div className="flex items-center gap-1 p-1.5 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl rounded-full shadow-sm border border-stone-200 dark:border-stone-800 font-outfit">
                    {menuItems.map((item, index) => (
                        <Link 
                            key={item.id} 
                            to={item.id} 
                            className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all flex items-center ${location.pathname === item.id ? 'bg-black text-white shadow-md' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                        >
                            <EditableText 
                                value={language === 'ko' ? item.ko : item.en}
                                onSave={(val) => handleMenuUpdate(index, val)}
                                as="span"
                            />
                        </Link>
                    ))}
                    <button onClick={handleLanguageChange} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-all text-stone-500 dark:text-stone-400" style={{ perspective: '1000px' }}>
                        <div className="transition-transform duration-500" style={{ transform: isRotating ? 'rotateY(360deg)' : 'rotateY(0deg)' }}>
                            <Globe size={14} />
                        </div>
                    </button>
                </div>
            </nav>

            {/* Sidebar Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[9000] flex items-end justify-center pb-32 pointer-events-none">
                    <div className="pointer-events-auto glass-heavy rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-white/40 p-2 flex flex-col gap-1 min-w-[200px] animate-spring-up origin-bottom">
                        <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-[1.5rem] hover:bg-black/5 transition-all text-xs font-bold text-stone-900 tracking-tight relative">
                            <CalendarIcon size={16} />
                            <span>{getLabel('BOOKING', '예약하기')}</span>
                            <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full animate-bounce shadow-sm" />
                        </Link>
                        <div className="h-px bg-black/5 mx-3 my-0.5" />
                        <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-[1.5rem] hover:bg-black/5 transition-all text-xs font-medium text-stone-600 group">
                            <Instagram size={16} className="text-pink-300 transition-colors" />
                            <span className="group-hover:text-pink-400 transition-colors">Instagram</span>
                        </a>
                        <a href={content.kakaoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-[1.5rem] hover:bg-black/5 transition-all text-xs font-medium text-stone-600 group">
                            <MessageCircle size={16} className="text-yellow-400 transition-colors" />
                            <span className="group-hover:text-yellow-500 transition-colors">KakaoTalk</span>
                        </a>
                    </div>
                </div>
            )}
            
            {isMenuOpen && <div className="fixed inset-0 z-[8999] bg-black/10 backdrop-blur-sm animate-fade-in" onClick={() => setIsMenuOpen(false)} />}
        </>
    );
};

export default Navigation;
