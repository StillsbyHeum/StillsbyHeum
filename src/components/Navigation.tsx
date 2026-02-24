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
            {/* Main Top Nav - Minimal Corner Menu */}
            <nav className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-6 text-editorial-micro">
                    {menuItems.map((item, index) => (
                        <Link 
                            key={item.id} 
                            to={item.id} 
                            className={`transition-opacity hover:opacity-50 ${location.pathname === item.id ? 'opacity-100' : 'opacity-70'}`}
                        >
                            <EditableText 
                                value={language === 'ko' ? item.ko : item.en}
                                onSave={(val) => handleMenuUpdate(index, val)}
                                as="span"
                            />
                        </Link>
                    ))}
                </div>
                
                <button onClick={handleLanguageChange} className="text-editorial-micro hover:opacity-50 transition-opacity flex items-center gap-1">
                    <Globe size={12} />
                    {language.toUpperCase()}
                </button>

                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden text-editorial-micro hover:opacity-50 transition-opacity"
                >
                    MENU
                </button>
            </nav>

            {/* Fullscreen Menu Overlay for Mobile */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[9000] bg-white dark:bg-[#050505] text-black dark:text-white flex flex-col p-6 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div className="text-editorial-micro">MENU</div>
                        <button onClick={() => setIsMenuOpen(false)} className="text-editorial-micro hover:opacity-50">CLOSE</button>
                    </div>
                    
                    <div className="flex flex-col gap-8 mt-20">
                        {menuItems.map((item, index) => (
                            <Link 
                                key={item.id} 
                                to={item.id} 
                                onClick={() => setIsMenuOpen(false)}
                                className="text-editorial-h2 hover:opacity-50 transition-opacity"
                            >
                                {language === 'ko' ? item.ko : item.en}
                            </Link>
                        ))}
                        
                        <div className="h-px bg-black/10 dark:bg-white/10 my-4" />
                        
                        <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-editorial-h3 hover:opacity-50 transition-opacity flex items-center gap-4">
                            {getLabel('BOOKING', '예약하기')}
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </Link>
                        
                        <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-editorial-body hover:opacity-50 transition-opacity">
                            INSTAGRAM
                        </a>
                        <a href={content.kakaoUrl} target="_blank" rel="noopener noreferrer" className="text-editorial-body hover:opacity-50 transition-opacity">
                            KAKAOTALK
                        </a>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;
