import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, User, Lock, Calendar as CalendarIcon, MessageCircle, ChevronRight, ChevronLeft, Instagram, X as CloseIcon, ChevronDown, ChevronUp, Star, Trash2, Plus, Play, Pause, MapPin, ArrowRight, Edit2, Bot, Settings, HelpCircle, Check, Map, Sparkles, Music, Send, Save, MinusCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { Language, DaySchedule, ContentData, AdminUser, NoticeItem, Review, PortfolioAlbum, FAQItem, AILog } from './types';
import { INITIAL_CONTENT, DEFAULT_SLOTS, ENCRYPTED_ADMIN_ID, ENCRYPTED_ADMIN_PW, INITIAL_REVIEWS } from './constants';
import { generateResponse } from './services/geminiService';

// --- Context Setup ---

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentData;
  updateContent: (key: keyof ContentData, subKey: string, value: any) => void;
  updateCollectionItem: <T extends { id: string }>(key: keyof ContentData, item: T) => void;
  addCollectionItem: <T extends { id: string }>(key: keyof ContentData, item: T) => void;
  removeCollectionItem: (key: keyof ContentData, id: string) => void;
  schedule: Record<string, DaySchedule>;
  toggleSlot: (date: string, slotId: string, action: 'book' | 'block', details?: any) => void;
  adminUser: AdminUser;
  loginAdmin: (email: string, password?: string) => boolean; 
  logoutAdmin: () => void;
  reviews: Review[];
  addReview: (review: Review) => void;
  deleteReview: (id: string) => void;
  addPortfolioImage: (albumId: string, imageUrl: string) => void;
  removePortfolioImage: (albumId: string, imageIndex: number) => void;
  // AI Management
  setAIContext: (newContext: string) => void;
  isPlaying: boolean;
  toggleAudio: () => void;
  requestBooking: (date: string, slotId: string) => void;
  selectedAlbum: PortfolioAlbum | null;
  setSelectedAlbum: (album: PortfolioAlbum | null) => void;
  viewingImage: string | null;
  setViewingImage: (url: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- AppProvider Implementation ---
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [content, setContent] = useState<ContentData>(INITIAL_CONTENT);
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({});
  const [adminUser, setAdminUser] = useState<AdminUser>({ email: '', isAuthenticated: false });
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio setup
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    audioRef.current = new Audio(content.backgroundMusicUrl);
    audioRef.current.loop = true;
    
    // Auto-play attempt
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => setIsPlaying(true))
            .catch(error => {
                console.log("Auto-play prevented. User interaction required.");
                setIsPlaying(false);
            });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [content.backgroundMusicUrl]);

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const updateContent = (key: keyof ContentData, subKey: string, value: any) => {
    setContent(prev => {
        const prevValue = prev[key];
        if (typeof prevValue === 'object' && !Array.isArray(prevValue) && prevValue !== null) {
            return { ...prev, [key]: { ...prevValue, [subKey]: value } };
        }
        return { ...prev, [key]: value };
    });
  };

  const updateCollectionItem = <T extends { id: string }>(key: keyof ContentData, item: T) => {
      setContent(prev => {
          const list = prev[key];
          if (Array.isArray(list)) {
              return { ...prev, [key]: list.map((i: any) => i.id === item.id ? item : i) };
          }
          return prev;
      });
  };

  const addCollectionItem = <T extends { id: string }>(key: keyof ContentData, item: T) => {
      setContent(prev => {
          const list = prev[key] as any[];
          return { ...prev, [key]: [...list, item] };
      });
  };

  const removeCollectionItem = (key: keyof ContentData, id: string) => {
      setContent(prev => {
          const list = prev[key] as any[];
          return { ...prev, [key]: list.filter(item => item.id !== id) };
      });
  };

  const toggleSlot = (date: string, slotId: string, action: 'book' | 'block', details?: any) => {
      setSchedule(prev => {
          const daySchedule = prev[date] || { date, slots: DEFAULT_SLOTS.map(t => ({ id: t, time: t, isBooked: false, isBlocked: false })) };
          const updatedSlots = daySchedule.slots.map(slot => {
              if (slot.id === slotId) {
                  return { 
                      ...slot, 
                      isBooked: action === 'book' ? !slot.isBooked : slot.isBooked,
                      isBlocked: action === 'block' ? !slot.isBlocked : slot.isBlocked
                  };
              }
              return slot;
          });
          return { ...prev, [date]: { ...daySchedule, slots: updatedSlots } };
      });
  };

  const loginAdmin = (email: string, password?: string) => {
      if (btoa(email) === ENCRYPTED_ADMIN_ID && password && btoa(password) === ENCRYPTED_ADMIN_PW) {
          setAdminUser({ email, isAuthenticated: true });
          return true;
      }
      return false;
  };

  const logoutAdmin = () => setAdminUser({ email: '', isAuthenticated: false });

  const addReview = (review: Review) => setReviews(prev => [review, ...prev]);
  const deleteReview = (id: string) => setReviews(prev => prev.filter(r => r.id !== id));

  const addPortfolioImage = (albumId: string, imageUrl: string) => {
      setContent(prev => {
          const updatedPortfolio = prev.portfolio.map(a => 
              a.id === albumId ? { ...a, images: [...a.images, imageUrl] } : a
          );
          if (selectedAlbum?.id === albumId) {
              const updatedAlbum = updatedPortfolio.find(a => a.id === albumId);
              if (updatedAlbum) setSelectedAlbum(updatedAlbum);
          }
          return { ...prev, portfolio: updatedPortfolio };
      });
  };

  const removePortfolioImage = (albumId: string, imageIndex: number) => {
      setContent(prev => {
          const updatedPortfolio = prev.portfolio.map(a => 
              a.id === albumId ? { ...a, images: a.images.filter((_, i) => i !== imageIndex) } : a
          );
          if (selectedAlbum?.id === albumId) {
              const updatedAlbum = updatedPortfolio.find(a => a.id === albumId);
              if (updatedAlbum) setSelectedAlbum(updatedAlbum);
          }
          return { ...prev, portfolio: updatedPortfolio };
      });
  };

  const setAIContext = (newContext: string) => setContent(prev => ({ ...prev, aiContext: newContext }));
  const requestBooking = (date: string, slotId: string) => { toggleSlot(date, slotId, 'book'); };

  return (
    <AppContext.Provider value={{
      language, setLanguage, content, updateContent, updateCollectionItem, addCollectionItem, removeCollectionItem,
      schedule, toggleSlot, adminUser, loginAdmin, logoutAdmin,
      reviews, addReview, deleteReview,
      addPortfolioImage, removePortfolioImage,
      setAIContext, isPlaying, toggleAudio, requestBooking,
      selectedAlbum, setSelectedAlbum,
      viewingImage, setViewingImage
    }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Styles & Helpers ---
const FOREST_GREEN = "bg-[#1a4c35]"; 

// Generic Editable Text - FIXED propagation issues
const GenericEditableText: React.FC<{ text: string | number; onSave: (v: string) => void; className?: string; stopPropagation?: boolean }> = ({ text, onSave, className, stopPropagation = true }) => {
    const { adminUser } = useAppContext();
    const handleEdit = (e: React.MouseEvent) => {
        if (!adminUser.isAuthenticated) return;
        if (stopPropagation) { 
            e.stopPropagation(); 
            e.nativeEvent.stopImmediatePropagation();
        }
        
        // Use timeout to ensure execution stack clears before blocking prompt
        setTimeout(() => {
            const newValue = prompt(`Edit text:`, String(text));
            if (newValue !== null) onSave(newValue);
        }, 10);
    };

    if (adminUser.isAuthenticated) {
        return (
            <span 
                onClick={handleEdit} 
                className={`cursor-pointer bg-yellow-100/30 hover:bg-yellow-200 hover:outline-dashed hover:outline-1 hover:outline-yellow-500 rounded px-1 transition-all relative group inline-block z-50 ${className}`}
                title="Click to edit"
            >
                {text || 'Empty'}
                <span className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-yellow-400 text-black text-[9px] px-1 rounded font-bold pointer-events-none z-50 shadow-sm">EDIT</span>
            </span>
        );
    }
    return <span className={className}>{text}</span>;
};

// Generic Editable Image
const GenericEditableImage: React.FC<{ src: string; onSave: (v: string) => void; className?: string; alt?: string }> = ({ src, onSave, className, alt }) => {
    const { adminUser } = useAppContext();
    const handleEdit = (e: React.MouseEvent) => {
        if (!adminUser.isAuthenticated) return;
        e.stopPropagation(); e.preventDefault();
        const newValue = prompt("Enter new image URL:", src);
        if (newValue !== null && newValue.trim() !== "") onSave(newValue);
    };

    return (
        <div className={`relative group ${className}`}>
            <img src={src} className="w-full h-full object-cover" alt={alt || ""} />
            {adminUser.isAuthenticated && (
                 <button onClick={handleEdit} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs z-10">
                    <Edit2 size={16} className="mr-1" /> CHANGE IMG
                 </button>
            )}
        </div>
    );
};

// Wrapper for Content Data
const EditableText: React.FC<{ valueKey: keyof ContentData; className?: string }> = ({ valueKey, className }) => {
    const { content, updateContent, language } = useAppContext();
    const textData = content[valueKey] as any;
    return <GenericEditableText text={textData[language]} onSave={(val) => updateContent(valueKey, language, val)} className={className} />;
};

const SplashScreen: React.FC<{ onFinish: () => void; isFinishing: boolean }> = ({ onFinish, isFinishing }) => {
    useEffect(() => {
        const timer = setTimeout(() => onFinish(), 2200);
        return () => clearTimeout(timer);
    }, [onFinish]);
    return (
        <div className={`fixed inset-0 z-[99999] bg-white flex items-center justify-center transition-all duration-1000 ${isFinishing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <h1 className="font-outfit text-4xl md:text-6xl font-bold tracking-tighter animate-pulse text-black">
                STILLS<span className="font-normal font-sans mx-2 text-stone-400">by</span>HEUM
            </h1>
        </div>
    );
};

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// --- Components ---

const AlbumDetail: React.FC = () => {
    const { selectedAlbum, setSelectedAlbum, removePortfolioImage, addPortfolioImage, adminUser, setViewingImage } = useAppContext();

    if (!selectedAlbum) return null;

    return (
        <div className="fixed inset-0 z-[9000] bg-white overflow-y-auto animate-fade-in">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-stone-100">
                <button onClick={() => setSelectedAlbum(null)} className="p-2 rounded-full hover:bg-stone-100"><CloseIcon size={24} /></button>
                <h2 className="font-outfit text-xl font-bold">{selectedAlbum.title.en}</h2>
                <div className="w-8"></div>
            </div>
            <div className="columns-1 md:columns-3 gap-4 px-4 py-8 max-w-7xl mx-auto space-y-4">
                {selectedAlbum.images.map((img, idx) => (
                    <div key={idx} className="relative group break-inside-avoid" onClick={() => setViewingImage(img)}>
                        <img src={img} className="w-full rounded-lg hover:opacity-90 transition cursor-zoom-in" alt={`Album ${idx}`} />
                        {adminUser.isAuthenticated && (
                            <button onClick={(e) => { e.stopPropagation(); removePortfolioImage(selectedAlbum.id, idx); }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                        )}
                    </div>
                ))}
                {adminUser.isAuthenticated && (
                    <button onClick={() => { const url = prompt("URL?"); if(url) addPortfolioImage(selectedAlbum.id, url); }} className="w-full aspect-[3/4] border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:text-stone-900"><Plus size={32} /> ADD PHOTO</button>
                )}
            </div>
        </div>
    );
};

// Simple Single Image Lightbox
const ImageViewer: React.FC = () => {
    const { viewingImage, setViewingImage } = useAppContext();
    if (!viewingImage) return null;

    return (
        <div className="fixed inset-0 z-[9995] bg-black/95 flex items-center justify-center animate-fade-in" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} className="max-w-full max-h-screen object-contain p-4 transition-transform duration-300 scale-100" />
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 backdrop-blur-sm">
                <CloseIcon size={24} />
            </button>
        </div>
    );
};

// Hero Section (3D Spline Restored)
const HeroSection: React.FC = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white mb-12">
        <iframe 
            src='https://my.spline.design/distortingtypography-PrREx0Qo4PCMDVyAYxd6bmrd/' 
            frameBorder='0' 
            width='100%' 
            height='100%'
            className="absolute inset-0 w-full h-full pointer-events-auto"
            title="Hero 3D Scene"
        />
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-end pb-48 md:pb-32">
            <div className="pointer-events-auto relative z-30">
                <EditableText valueKey="heroSubtitle" className="text-stone-500 font-medium tracking-wide text-sm md:text-base bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/40" />
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
    </section>
  );
};

// Simplified Navigation - Floating on Top
const Navigation: React.FC = () => {
    const { language, setLanguage, isPlaying, toggleAudio } = useAppContext();
    const location = useLocation();

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[8000] flex items-center gap-1 p-2 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20">
             <Link to="/" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Portfolio</Link>
             <Link to="/info" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/info' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Info</Link>
             <Link to="/contact" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/contact' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Book</Link>
             
             <div className="w-px h-4 bg-stone-300 mx-1" />
             
             <button onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')} className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold hover:bg-stone-100">{language.toUpperCase()}</button>
             <button onClick={toggleAudio} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100">{isPlaying ? <Pause size={14} /> : <Play size={14} />}</button>
        </nav>
    );
};

// Floating Dock for Socials & AI
const FloatingDock: React.FC<{ onOpenFAQ: () => void }> = ({ onOpenFAQ }) => {
    const { content } = useAppContext();
    return (
        <div className="fixed bottom-8 left-0 w-full flex justify-center z-[8000] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 p-3 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/20 transition-all animate-spring-up hover:scale-105">
                <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-stone-100 rounded-full hover:bg-pink-50 text-stone-600 hover:text-pink-500 transition shadow-sm">
                    <Instagram size={20} />
                </a>
                <a href={content.kakaoUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-stone-100 rounded-full hover:bg-yellow-100 text-stone-600 hover:text-yellow-700 transition shadow-sm">
                    <MessageCircle size={20} />
                </a>
                <div className="w-px h-5 bg-stone-300 mx-1" />
                <button onClick={onOpenFAQ} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full font-bold text-xs hover:bg-stone-800 transition shadow-md">
                    {/* Custom Face Icon without Circle */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                    <span>HEUM's Ai</span>
                </button>
            </div>
        </div>
    );
};

// Portfolio Strip Component
const PortfolioStrip: React.FC<{ album: PortfolioAlbum, duration: number }> = ({ album, duration }) => {
    const { language, setSelectedAlbum, updateCollectionItem, adminUser, setViewingImage } = useAppContext();
    // Triple the images to ensure smooth looping
    const displayImages = [...album.images, ...album.images, ...album.images].slice(0, 15); 
    const fallbackImage = album.cover;

    return (
        <div className="relative w-full h-auto py-4 overflow-hidden bg-white border-b border-stone-100 last:border-0 group/strip">
            {/* Floating Title - Centered - Click to Enter Album */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="bg-white/80 backdrop-blur-sm px-8 py-3 rounded-full shadow-sm border border-white/50 pointer-events-auto cursor-pointer hover:scale-105 transition transform" onClick={() => setSelectedAlbum(album)}>
                    <h3 className="text-xl md:text-3xl font-bold tracking-tighter text-black uppercase font-outfit relative group/title">
                         {/* Enhanced EditableText Visibility */}
                         <GenericEditableText 
                            text={language === 'ko' ? album.title.ko : album.title.en} 
                            onSave={(val) => updateCollectionItem('portfolio', { ...album, title: { ...album.title, [language]: val } })}
                            className="relative z-50"
                        />
                    </h3>
                </div>
            </div>

            {/* Marquee Container - Continuous Flow (Pause only if Admin) - Variable Speed */}
            <div 
                className={`flex gap-4 animate-marquee ${adminUser.isAuthenticated ? 'hover:[animation-play-state:paused]' : ''} w-max px-4 items-center`}
                style={{ animationDuration: `${duration}s` }}
            >
                {(displayImages.length > 0 ? displayImages : [fallbackImage, fallbackImage, fallbackImage, fallbackImage]).map((img, idx) => (
                    <div 
                        key={`${album.id}-${idx}`} 
                        // Click Image -> Open Lightbox
                        onClick={() => setViewingImage(img)}
                        className={`
                            relative shrink-0 rounded-lg overflow-hidden cursor-pointer
                            w-[85vw] h-auto aspect-[3/4]  /* Mobile: Wide card */
                            md:w-auto md:h-[60vh] md:aspect-[3/4] /* Desktop: Height constraint */
                        `}
                    >
                        <GenericEditableImage 
                            src={img} 
                            onSave={(newUrl) => {
                                alert("Please click the title to enter album view and manage photos securely.");
                            }}
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/strip:bg-black/10 transition pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Pages
const PortfolioPage: React.FC = () => {
    const { content } = useAppContext();
    // Order: Wedding -> Couple -> Solo -> Event
    const orderedIds = ['wedding', 'couple', 'solo', 'event'];
    // Distinct speeds for visual variety
    const durations = [60, 40, 50, 30]; 

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Restored Hero Section */}
            <HeroSection />
            
            <div className="flex flex-col gap-0 -mt-12 relative z-10 bg-white rounded-t-[3rem] shadow-2xl pt-12">
                {orderedIds.map((id, index) => {
                    const album = content.portfolio.find(p => p.id === id);
                    if (!album) return null;
                    return <PortfolioStrip key={id} album={album} duration={durations[index]} />;
                })}
            </div>
        </div>
    );
};

const ReviewSection: React.FC = () => {
    const { reviews, language, adminUser, deleteReview } = useAppContext();
    return (
        <section className="py-8">
            <h2 className="text-3xl font-bold font-outfit mb-8 text-center">REVIEWS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map(r => (
                    <div key={r.id} className="p-6 bg-stone-50 rounded-2xl relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="font-bold text-lg">{r.author}</span>
                                <div className="flex text-yellow-400 text-xs">
                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                            </div>
                            <span className="text-xs text-stone-400">{r.date}</span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed mb-4">{r.content}</p>
                        {r.photos && r.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {r.photos.map((p, i) => (
                                    <img key={i} src={p} className="w-16 h-16 object-cover rounded-lg" alt="Review" />
                                ))}
                            </div>
                        )}
                        {adminUser.isAuthenticated && (
                            <button onClick={() => deleteReview(r.id)} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

const InfoPage: React.FC = () => {
    const { content, language, updateCollectionItem } = useAppContext();
    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-4xl mx-auto space-y-24">
             <section className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Artist</h2>
                <p className="text-xl md:text-2xl leading-relaxed font-light whitespace-pre-line"><EditableText valueKey="artistGreeting" /></p>
             </section>

             <section>
                <h2 className="text-3xl font-bold font-outfit mb-8 text-center">PACKAGES</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.packages.map(pkg => (
                        <div key={pkg.id} className={`p-8 rounded-3xl border relative overflow-hidden group ${pkg.color} min-h-[300px]`}>
                            <h3 className="text-2xl font-bold mb-2"><GenericEditableText text={pkg.title[language]} onSave={v => updateCollectionItem('packages', {...pkg, title: {...pkg.title, [language]: v}})} /></h3>
                            <p className="text-lg opacity-70 mb-6"><GenericEditableText text={pkg.price} onSave={v => updateCollectionItem('packages', {...pkg, price: v})} /></p>
                            <ul className="space-y-2 text-sm opacity-90">
                                {pkg.features[language].map((f, i) => (
                                    <li key={i} className="flex gap-2"><Check size={14} className="mt-1"/> <span>{f}</span></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center mt-12">
                    <Link to="/contact" className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition transform shadow-xl flex items-center gap-2">
                        {language === 'ko' ? '예약하러 가기' : 'Book Now'} <ArrowRight size={20} />
                    </Link>
                </div>
             </section>

             <section>
                 <h2 className="text-3xl font-bold font-outfit mb-8 text-center">NOTICE</h2>
                 <div className="space-y-8">
                     {content.notices.map(n => (
                         <div key={n.id} className="border-l-2 border-stone-200 pl-6">
                             <h4 className="font-bold text-lg mb-2"><GenericEditableText text={n.title[language]} onSave={v => updateCollectionItem('notices', {...n, title: {...n.title, [language]: v}})} /></h4>
                             <p className="text-stone-600 whitespace-pre-line"><GenericEditableText text={n.description[language]} onSave={v => updateCollectionItem('notices', {...n, description: {...n.description, [language]: v}})} /></p>
                         </div>
                     ))}
                 </div>
             </section>

             <ReviewSection />
        </div>
    );
};

const CalendarView: React.FC = () => {
    const { schedule, toggleSlot, language, requestBooking, adminUser } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [bookingForm, setBookingForm] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to get local YYYY-MM-DD string
    const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initial Date Setup
    useEffect(() => {
        const d = new Date(); d.setDate(d.getDate() + 1);
        setSelectedDate(getLocalDateStr(d));
    }, []);

    // Generate Calendar Cells with padding
    const getCalendarCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayIndex = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const totalDays = lastDayOfMonth.getDate();

        const cells = [];
        for (let i = 0; i < startingDayIndex; i++) {
            cells.push(null);
        }
        for (let i = 1; i <= totalDays; i++) {
            cells.push(new Date(year, month, i));
        }
        return cells;
    };

    const calendarCells = getCalendarCells();
    const todayStr = getLocalDateStr(new Date());

    const toggleTime = (t: string) => {
        if (selectedTimeSlots.includes(t)) setSelectedTimeSlots(prev => prev.filter(x => x !== t));
        else setSelectedTimeSlots(prev => [...prev, t].sort());
    };

    const toggleLocation = (loc: string) => {
        if (selectedLocations.includes(loc)) setSelectedLocations(prev => prev.filter(x => x !== loc));
        else setSelectedLocations(prev => [...prev, loc]);
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...bookingForm,
            date: selectedDate,
            timeSlots: selectedTimeSlots.join(', '),
            locations: selectedLocations.join(', '),
            lang: language
        };

        try {
            const response = await fetch("https://formspree.io/f/maqddwqk", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert(language === 'ko' ? "예약 요청이 전송되었습니다." : "Request sent.");
                selectedTimeSlots.forEach(t => requestBooking(selectedDate, t));
                setBookingForm(null);
                setSelectedTimeSlots([]);
                setSelectedLocations([]);
            } else {
                alert(language === 'ko' ? "전송에 실패했습니다. 다시 시도해주세요." : "Failed to send. Please try again.");
            }
        } catch (error) {
             alert(language === 'ko' ? "오류가 발생했습니다." : "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Constraint Logic
    const isSlotDisabled = (dateStr: string, timeStr: string) => {
        const slotDate = new Date(`${dateStr}T${timeStr}`);
        const now = new Date();
        const fourHoursLater = new Date(now.getTime() + (4 * 60 * 60 * 1000));

        // 1. 4 Hours Buffer
        if (slotDate < fourHoursLater) return true;

        const dayOfWeek = slotDate.getDay(); // 0 Sun, 6 Sat

        // 2. Saturday > 14:00 Blocked
        if (dayOfWeek === 6) {
            const hour = parseInt(timeStr.split(':')[0]);
            // If time is 15:00 or later, block. 14:00 is acceptable? 
            // "2시 이후 불가" usually implies 14:00 is the last slot or 14:00 is not allowed. 
            // Assuming 14:00 is fine, 15:00+ blocked.
            if (hour > 14) return true;
        }

        // 3. Weekday (Mon-Fri) 07:00-16:00
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const hour = parseInt(timeStr.split(':')[0]);
            if (hour < 7 || hour > 16) return true;
        }

        // 4. Sunday (Usually fully blocked based on calendar view, but specific slots also blocked)
        if (dayOfWeek === 0) return true;

        return false;
    };

    return (
        <div>
            {/* Location Selection First */}
            <div className="mb-8">
                <h3 className="font-bold mb-3">{language === 'ko' ? '1. 촬영 장소 선택 (다중 선택 가능)' : '1. Select Location(s)'}</h3>
                <div className="flex flex-wrap gap-2">
                    {['Big Ben', 'Tower Bridge', 'London Eye', 'St. Pauls', 'Notting Hill', 'Others'].map(loc => (
                        <button 
                            key={loc} 
                            onClick={() => toggleLocation(loc)}
                            className={`px-4 py-2 rounded-full border text-sm transition ${selectedLocations.includes(loc) ? 'bg-black text-white border-black' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                        >
                            {loc}
                        </button>
                    ))}
                </div>
            </div>

            <h3 className="font-bold mb-3">{language === 'ko' ? '2. 날짜 및 시간 선택' : '2. Select Date & Time'}</h3>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d); }}><ChevronLeft /></button>
                <span className="font-bold">{currentDate.toLocaleDateString(language==='ko'?'ko-KR':'en-US', {month:'long', year:'numeric'})}</span>
                <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d); }}><ChevronRight /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-6 text-center text-sm">
                {['S','M','T','W','T','F','S'].map((day,i) => <div key={i} className={`font-bold text-[10px] py-2 ${i===0 ? 'text-red-400':''}`}>{day}</div>)}
                
                {calendarCells.map((cell, i) => {
                    if (!cell) {
                         return <div key={`empty-${i}`} className="h-14"></div>;
                    }
                    
                    const day = cell as Date;
                    const dateStr = getLocalDateStr(day);
                    const isSel = selectedDate === dateStr;
                    const isPast = dateStr < todayStr;
                    const isSunday = day.getDay() === 0;
                    
                    let className = "relative p-2 rounded-lg transition-all h-14 flex flex-col items-center justify-center ";
                    if (isSel) className += "bg-black text-white shadow-lg scale-105 z-10 ";
                    else if (isPast) className += "text-stone-300 backdrop-blur-sm opacity-30 cursor-not-allowed ";
                    else if (isSunday) className += "text-red-300 cursor-not-allowed bg-red-50/50 "; // Keep styling but remove text
                    else className += "hover:bg-stone-100 text-stone-600 ";

                    return (
                        <button 
                            key={dateStr} 
                            disabled={isPast || isSunday}
                            onClick={() => {setSelectedDate(dateStr); setSelectedTimeSlots([]);}} 
                            className={className}
                        >
                            <span className="text-sm font-bold">{day.getDate()}</span>
                            {/* Removed the 'FULL' span here */}
                        </button>
                    )
                })}
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {DEFAULT_SLOTS.map(time => {
                    // Schedule Check
                    const isBlocked = schedule[selectedDate]?.slots.find(s=>s.time===time)?.isBlocked;
                    const isBooked = schedule[selectedDate]?.slots.find(s=>s.time===time)?.isBooked;
                    
                    // Logic Check (4h, Sat 2pm, etc)
                    const isConstraintDisabled = isSlotDisabled(selectedDate, time);

                    const isSel = selectedTimeSlots.includes(time);
                    
                    // Admin override: Admin can select blocked/booked/constrained slots to manage them
                    const disabled = !adminUser.isAuthenticated && (isBlocked || isBooked || isConstraintDisabled);

                    let btnClass = "py-3 text-sm border rounded-xl transition font-medium ";
                    if (isSel) btnClass += "bg-green-800 text-white border-green-800 shadow-md transform scale-105 ";
                    else if (disabled) btnClass += "bg-stone-100 text-stone-300 border-transparent cursor-not-allowed ";
                    else btnClass += "bg-white border-stone-200 hover:border-black text-stone-700 ";

                    return (
                        <button key={time} disabled={disabled} onClick={() => adminUser.isAuthenticated ? toggleSlot(selectedDate, time, 'block') : toggleTime(time)} 
                            className={btnClass}>
                            {time}
                        </button>
                    )
                })}
            </div>

            {/* Next Button */}
            {selectedTimeSlots.length > 0 && selectedLocations.length > 0 && !bookingForm && (
                <button onClick={() => setBookingForm({})} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition shadow-xl animate-fade-in">
                    NEXT STEP <ArrowRight size={16} className="inline ml-1"/>
                </button>
            )}

            {/* Booking Form */}
            {bookingForm && (
                <form onSubmit={handleBooking} className="space-y-4 bg-stone-50 p-6 rounded-2xl animate-fade-in border border-stone-200 mt-6">
                    <h4 className="font-bold text-lg mb-4">{language === 'ko' ? '3. 예약 정보 입력' : '3. Booking Details'}</h4>
                    
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase">Package</label>
                        <div className="flex gap-2 flex-wrap mt-2">
                             {['60min', '90min', '120min', '180min'].map(p => (
                                 <button type="button" key={p} onClick={() => setBookingForm({...bookingForm, package: p})} className={`px-4 py-2 border rounded-full text-sm font-bold transition ${bookingForm.package === p ? 'bg-black text-white border-black' : 'bg-white text-stone-500 border-stone-200'}`}>{p}</button>
                             ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <input required placeholder={language === 'ko' ? "성함" : "Name"} className="p-3 border rounded-xl text-stone-900" onChange={e => setBookingForm({...bookingForm, name: e.target.value})} />
                         <input required placeholder={language === 'ko' ? "연락처/카톡ID" : "Contact/KakaoID"} className="p-3 border rounded-xl text-stone-900" onChange={e => setBookingForm({...bookingForm, contact: e.target.value})} />
                    </div>
                    
                    <input required placeholder={language === 'ko' ? "이메일" : "Email"} type="email" className="w-full p-3 border rounded-xl text-stone-900" onChange={e => setBookingForm({...bookingForm, email: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <input required placeholder={language === 'ko' ? "인원 (예: 2명)" : "Participants (e.g. 2)"} className="p-3 border rounded-xl text-stone-900" onChange={e => setBookingForm({...bookingForm, count: e.target.value})} />
                        <input required placeholder={language === 'ko' ? "관계 (예: 커플)" : "Relationship (e.g. Couple)"} className="p-3 border rounded-xl text-stone-900" onChange={e => setBookingForm({...bookingForm, relation: e.target.value})} />
                    </div>

                    <input placeholder={language === 'ko' ? "준비한 소품 (선택)" : "Props (Optional)"} className="w-full p-3 border rounded-xl text-stone-900" onChange={e => setBookingForm({...bookingForm, props: e.target.value})} />

                    <textarea placeholder={language === 'ko' ? "남기실 말씀 / 원하시는 분위기" : "Comments / Vibe you want"} className="w-full p-3 border rounded-xl text-stone-900 h-24 resize-none" onChange={e => setBookingForm({...bookingForm, memo: e.target.value})} />
                    
                    <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg flex items-center justify-center">
                        {isSubmitting ? 'SENDING...' : 'CONFIRM BOOKING'}
                    </button>
                </form>
            )}
        </div>
    );
};

const ContactPage: React.FC = () => {
    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-lg mx-auto">
            <h1 className="text-3xl font-bold font-outfit mb-10 text-center">RESERVATION</h1>
            <CalendarView />
        </div>
    );
};

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

const FAQWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { content, language } = useAppContext();
    const [q, setQ] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: 0, text: language === 'ko' ? "안녕하세요! 무엇을 도와드릴까요?" : "Hello! How can I help you?", sender: 'bot' }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const addMessage = (text: string, sender: 'user' | 'bot') => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
    };

    const handleAsk = async (text: string) => {
        if (!text.trim()) return;
        addMessage(text, 'user');
        setLoading(true);
        const res = await generateResponse(text, content.aiContext);
        setLoading(false);
        addMessage(res, 'bot');
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        handleAsk(q);
        setQ('');
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                    <div className="flex items-center gap-2">
                        {/* Custom Face Icon without Circle (Small) */}
                         <div className="bg-black text-white p-1.5 rounded-full">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                <line x1="9" y1="9" x2="9.01" y2="9" />
                                <line x1="15" y1="9" x2="15.01" y2="9" />
                            </svg>
                        </div>
                        <h3 className="font-bold font-outfit">HEUM's Ai</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full"><CloseIcon size={20}/></button>
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.sender === 'user' 
                                ? 'bg-stone-900 text-white rounded-tr-none' 
                                : 'bg-white text-stone-800 border border-stone-100 rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-stone-400 p-3 rounded-2xl rounded-tl-none text-xs border border-stone-100 flex gap-1 items-center">
                                <Sparkles size={12} className="animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* FAQ Quick Chips - Modified to Wrap */}
                <div className="p-4 bg-white border-t border-stone-100 max-h-40 overflow-y-auto">
                     <div className="flex flex-wrap gap-2 justify-center">
                        {content.faqs.map(f => (
                            <button 
                                key={f.id} 
                                onClick={() => {
                                    addMessage(f.q[language], 'user');
                                    setTimeout(() => addMessage(f.a[language], 'bot'), 500);
                                }}
                                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-full text-xs font-bold text-stone-600 transition"
                            >
                                {f.q[language]}
                            </button>
                        ))}
                     </div>
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white pb-6">
                    <form onSubmit={submitForm} className="relative flex items-center gap-2">
                        <input 
                            value={q} 
                            onChange={e=>setQ(e.target.value)} 
                            placeholder={language === 'ko' ? "메시지를 입력하세요..." : "Type a message..."}
                            className="flex-1 p-3 pl-4 rounded-full bg-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-stone-300 transition" 
                        />
                        <button type="submit" disabled={!q.trim() || loading} className="p-3 bg-black text-white rounded-full hover:scale-105 transition disabled:opacity-50 disabled:scale-100">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Admin Modal - iPhone Style UI with Comprehensive Management
const AdminModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { adminUser, loginAdmin, logoutAdmin, setAIContext, content, updateContent, updateCollectionItem, addCollectionItem, removeCollectionItem, reviews, deleteReview } = useAppContext();
    const [ctx, setCtx] = useState(content.aiContext);
    const [greeting, setGreeting] = useState({ ko: content.artistGreeting.ko, en: content.artistGreeting.en });
    const [musicUrl, setMusicUrl] = useState(content.backgroundMusicUrl);
    const [creds, setCreds] = useState({ id: '', pw: '' });
    const [activeTab, setActiveTab] = useState<'main' | 'greeting' | 'faqs' | 'reviews' | 'gallery' | 'settings'>('main');
    const navigate = useNavigate();

    // FAQ State
    const [newFAQ, setNewFAQ] = useState({ q: { ko: '', en: '' }, a: { ko: '', en: '' } });

    // Sync local greeting state with context content
    useEffect(() => {
        setGreeting({ ko: content.artistGreeting.ko, en: content.artistGreeting.en });
    }, [content.artistGreeting]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md transition-all animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-sm bg-white/70 backdrop-blur-2xl rounded-[32px] shadow-2xl overflow-hidden border border-white/40 animate-pop-in flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="pt-6 pb-4 px-6 border-b border-gray-200/50 flex justify-between items-center bg-white/30 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                        {adminUser.isAuthenticated ? (activeTab === 'main' ? 'Control Center' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)) : 'Admin Access'}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-200/50 rounded-full text-gray-500 hover:bg-gray-300/50 transition">
                        <CloseIcon size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
                    {adminUser.isAuthenticated ? (
                        <>
                            {/* Navigation Tabs */}
                            {activeTab !== 'main' && (
                                <button onClick={() => setActiveTab('main')} className="mb-6 text-blue-500 font-medium flex items-center text-base hover:text-blue-600 transition">
                                    <ChevronLeft size={20} className="mr-1" /> Back
                                </button>
                            )}

                            {activeTab === 'main' && (
                                <div className="space-y-4">
                                    <div className="bg-white/60 rounded-2xl overflow-hidden shadow-sm border border-white/50">
                                        <button onClick={() => setActiveTab('greeting')} className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-white/80 transition active:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-orange-400 p-1.5 rounded-lg text-white"><MessageCircle size={16}/></div>
                                                <span className="font-medium text-gray-900">Edit Greeting</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                        <div className="h-px bg-gray-200/50 mx-5" />
                                        <button onClick={() => setActiveTab('gallery')} className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-white/80 transition active:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-purple-500 p-1.5 rounded-lg text-white"><ImageIcon size={16}/></div>
                                                <span className="font-medium text-gray-900">Manage Gallery</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                        <div className="h-px bg-gray-200/50 mx-5" />
                                        <button onClick={() => setActiveTab('faqs')} className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-white/80 transition active:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-500 p-1.5 rounded-lg text-white"><HelpCircle size={16}/></div>
                                                <span className="font-medium text-gray-900">Manage FAQs</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                        <div className="h-px bg-gray-200/50 mx-5" />
                                        <button onClick={() => setActiveTab('reviews')} className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-white/80 transition active:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-yellow-500 p-1.5 rounded-lg text-white"><Star size={16}/></div>
                                                <span className="font-medium text-gray-900">Manage Reviews</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                    </div>

                                    <div className="bg-white/60 rounded-2xl overflow-hidden shadow-sm border border-white/50">
                                        <button onClick={() => { onClose(); navigate('/contact'); }} className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-white/80 transition active:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-500 p-1.5 rounded-lg text-white"><CalendarIcon size={16}/></div>
                                                <span className="font-medium text-gray-900">Manage Schedule</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                    </div>

                                    <div className="bg-white/60 rounded-2xl overflow-hidden shadow-sm border border-white/50">
                                        <button onClick={() => setActiveTab('settings')} className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-white/80 transition active:bg-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-500 p-1.5 rounded-lg text-white"><Settings size={16}/></div>
                                                <span className="font-medium text-gray-900">System Settings</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                    </div>

                                    <button onClick={logoutAdmin} className="w-full h-12 bg-white rounded-2xl text-red-500 font-semibold text-base shadow-sm hover:bg-red-50 transition border border-red-100 mt-4">
                                        Log Out
                                    </button>
                                </div>
                            )}

                            {activeTab === 'greeting' && (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Korean Greeting</label>
                                        <textarea 
                                            value={greeting.ko} 
                                            onChange={e => setGreeting({...greeting, ko: e.target.value})}
                                            className="w-full h-32 bg-white/60 p-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-white/50" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">English Greeting</label>
                                        <textarea 
                                            value={greeting.en} 
                                            onChange={e => setGreeting({...greeting, en: e.target.value})}
                                            className="w-full h-32 bg-white/60 p-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-white/50" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => { updateContent('artistGreeting', '', greeting); alert('Saved'); }} 
                                        className="w-full h-12 bg-blue-500 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-600 transition"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}

                            {activeTab === 'gallery' && (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="bg-blue-50 p-4 rounded-2xl text-xs text-blue-600 mb-4 leading-relaxed">
                                        Note: To add or remove specific photos, please go to the <strong>Portfolio Page</strong> and click on the album title. This section creates/renames albums.
                                    </div>
                                    {content.portfolio.map((album) => (
                                        <div key={album.id} className="bg-white/60 p-4 rounded-2xl space-y-2 border border-white/50">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-gray-400 uppercase">{album.id}</span>
                                            </div>
                                            <input 
                                                className="w-full bg-transparent border-b border-gray-200 text-sm font-bold pb-1 focus:outline-none focus:border-blue-500" 
                                                value={album.title.ko} 
                                                onChange={e => updateCollectionItem('portfolio', { ...album, title: { ...album.title, ko: e.target.value } })} 
                                                placeholder="Title (KR)" 
                                            />
                                            <input 
                                                className="w-full bg-transparent border-b border-gray-200 text-sm pb-1 text-gray-600 focus:outline-none focus:border-blue-500" 
                                                value={album.title.en} 
                                                onChange={e => updateCollectionItem('portfolio', { ...album, title: { ...album.title, en: e.target.value } })} 
                                                placeholder="Title (EN)" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'faqs' && (
                                <div className="space-y-4 animate-slide-up pb-10">
                                    {content.faqs.map((faq) => (
                                        <div key={faq.id} className="bg-white/60 p-4 rounded-2xl space-y-2 relative group border border-white/50 hover:bg-white/80 transition">
                                            <div className="grid grid-cols-1 gap-2">
                                                <input className="bg-transparent border-b border-gray-200/50 text-sm font-bold pb-1 focus:outline-none" value={faq.q.ko} onChange={e => updateCollectionItem('faqs', { ...faq, q: { ...faq.q, ko: e.target.value } })} placeholder="Q (KR)" />
                                                <input className="bg-transparent border-b border-gray-200/50 text-sm pb-1 text-gray-500 focus:outline-none" value={faq.q.en} onChange={e => updateCollectionItem('faqs', { ...faq, q: { ...faq.q, en: e.target.value } })} placeholder="Q (EN)" />
                                                <textarea className="bg-transparent text-xs text-gray-700 resize-none h-16 border-b border-gray-200/50 focus:outline-none pt-1" value={faq.a.ko} onChange={e => updateCollectionItem('faqs', { ...faq, a: { ...faq.a, ko: e.target.value } })} placeholder="A (KR)" />
                                                <textarea className="bg-transparent text-xs text-gray-500 resize-none h-16 focus:outline-none pt-1" value={faq.a.en} onChange={e => updateCollectionItem('faqs', { ...faq, a: { ...faq.a, en: e.target.value } })} placeholder="A (EN)" />
                                            </div>
                                            <button onClick={() => removeCollectionItem('faqs', faq.id)} className="absolute top-2 right-2 text-red-400 p-2 hover:bg-red-50 rounded-full"><MinusCircle size={16}/></button>
                                        </div>
                                    ))}
                                    
                                    <div className="bg-blue-50/80 p-4 rounded-2xl space-y-3 border border-blue-100">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Add New FAQ</p>
                                        <input className="w-full bg-white px-3 py-2 rounded-xl text-sm border-none shadow-sm" placeholder="Question (KR)" value={newFAQ.q.ko} onChange={e => setNewFAQ({...newFAQ, q: {...newFAQ.q, ko: e.target.value}})} />
                                        <input className="w-full bg-white px-3 py-2 rounded-xl text-sm border-none shadow-sm" placeholder="Answer (KR)" value={newFAQ.a.ko} onChange={e => setNewFAQ({...newFAQ, a: {...newFAQ.a, ko: e.target.value}})} />
                                        <button 
                                            onClick={() => {
                                                if(newFAQ.q.ko) {
                                                    addCollectionItem('faqs', { id: `f${Date.now()}`, q: newFAQ.q, a: newFAQ.a });
                                                    setNewFAQ({ q: { ko: '', en: '' }, a: { ko: '', en: '' } });
                                                }
                                            }}
                                            className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition"
                                        >
                                            Add Item
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-3 animate-slide-up">
                                    <div className="bg-yellow-50 p-4 rounded-2xl text-xs text-yellow-700 mb-4 leading-relaxed">
                                        To edit content, please modify the database directly. Here you can delete inappropriate reviews.
                                    </div>
                                    {reviews.map(r => (
                                        <div key={r.id} className="bg-white/60 p-4 rounded-2xl flex justify-between items-center border border-white/50">
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-sm text-gray-900">{r.author} <span className="text-xs font-normal text-gray-400">({r.date})</span></p>
                                                <p className="text-xs text-gray-500 truncate w-48 mt-1">{r.content}</p>
                                            </div>
                                            <button onClick={() => deleteReview(r.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition shrink-0">
                                                <MinusCircle size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-6 animate-slide-up">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Background Music URL</label>
                                        <input 
                                            value={musicUrl} 
                                            onChange={e => setMusicUrl(e.target.value)} 
                                            className="w-full h-12 bg-white/60 px-4 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition border border-white/50" 
                                            placeholder="https://..." 
                                        />
                                        <button onClick={() => { updateContent('backgroundMusicUrl', '', musicUrl); alert('Music Updated'); }} className="mt-2 w-full h-10 bg-gray-200/80 rounded-xl text-gray-700 font-semibold text-xs hover:bg-gray-300/80 transition">
                                            Update Music
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">AI Context Prompt</label>
                                        <textarea 
                                            value={ctx} 
                                            onChange={e => setCtx(e.target.value)} 
                                            className="w-full h-32 bg-white/60 p-4 rounded-2xl text-xs leading-relaxed placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none border border-white/50" 
                                            placeholder="Instructions for the AI..." 
                                        />
                                        <button onClick={() => { setAIContext(ctx); alert('Context Saved'); }} className="mt-2 w-full h-10 bg-gray-200/80 rounded-xl text-gray-700 font-semibold text-xs hover:bg-gray-300/80 transition">
                                            Save Context
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4 pt-10">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4 shadow-inner">
                                    <Lock size={32} className="text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-sm">Please authenticate to continue</p>
                            </div>
                            <input 
                                placeholder="Email" 
                                className="w-full h-14 bg-white/60 px-5 rounded-2xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition border border-white/50"
                                onChange={e => setCreds({ ...creds, id: e.target.value })} 
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                className="w-full h-14 bg-white/60 px-5 rounded-2xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition border border-white/50"
                                onChange={e => setCreds({ ...creds, pw: e.target.value })} 
                            />
                            <button 
                                onClick={() => { if (loginAdmin(creds.id, creds.pw)) setCreds({ id: '', pw: '' }); else alert('Invalid Credentials'); }} 
                                className="w-full h-14 bg-[#007AFF] text-white rounded-2xl font-semibold text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition mt-4 active:scale-[0.98]"
                            >
                                Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Logic: Today resets at 07:00 KST. Increases by 1 every 23 mins from 07:00.
// KST is UTC+9.
const VisitorCounter = () => {
    const [todayCount, setTodayCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        // 1. Calculate KST Time
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const kstTime = new Date(utc + (9 * 60 * 60 * 1000));
        
        // 2. Determine Current "Business Day" (Starts at 07:00 KST)
        // If hour < 7, it belongs to previous day's cycle
        const currentBusinessDay = new Date(kstTime);
        if (currentBusinessDay.getHours() < 7) {
            currentBusinessDay.setDate(currentBusinessDay.getDate() - 1);
        }
        const businessDateStr = currentBusinessDay.toISOString().split('T')[0];

        // 3. Storage Key for Business Day
        const storedDate = localStorage.getItem('bizDate');
        
        // 4. Base Counts (Real Visits)
        let baseDaily = parseInt(localStorage.getItem('baseDaily') || '0');
        let total = parseInt(localStorage.getItem('totalCnt') || '1234');

        // 5. Check for New Day Reset
        if (storedDate !== businessDateStr) {
            baseDaily = 0; // Reset daily
            localStorage.setItem('bizDate', businessDateStr);
            localStorage.setItem('baseDaily', '0');
            // Remove session flag so user counts as new visit for new day
            sessionStorage.removeItem('v'); 
        }

        // 6. Increment for current session visit
        if (!sessionStorage.getItem('v')) {
            baseDaily++;
            total++;
            localStorage.setItem('baseDaily', baseDaily.toString());
            localStorage.setItem('totalCnt', total.toString());
            sessionStorage.setItem('v', '1');
        }

        // 7. Calculate "Auto-Increment" based on time passed since 07:00 KST
        // 07:00 KST today/yesterday depending on businessDateStr logic
        const startOfBizDay = new Date(currentBusinessDay);
        startOfBizDay.setHours(7, 0, 0, 0);
        
        const diffMs = kstTime.getTime() - startOfBizDay.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const autoCount = Math.max(0, Math.floor(diffMinutes / 23));

        setTodayCount(baseDaily + autoCount);
        setTotalCount(total);

    }, []);

    return (
        <div className="flex flex-col items-center text-[10px] font-mono text-stone-400 gap-1">
            <div>TODAY <span className="text-stone-900 font-bold">{todayCount}</span></div>
            <div>TOTAL <span className="text-stone-500 font-bold">{totalCount}</span></div>
        </div>
    );
};

// --- Main App Component ---

const AppContent: React.FC = () => {
    const [splash, setSplash] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const location = useLocation();

    const handleFinish = () => { setFinishing(true); setTimeout(() => setSplash(false), 1000); };

    return (
        <div className="font-sans text-stone-900 bg-white min-h-screen relative selection:bg-yellow-200">
            {splash && <SplashScreen onFinish={handleFinish} isFinishing={finishing} />}
            
            <ScrollToTop />
            <Navigation />

            {/* Transition Wrapper */}
            <div key={location.pathname} className="animate-fade-in">
                <Routes location={location}>
                    <Route path="/" element={<PortfolioPage />} />
                    <Route path="/info" element={<InfoPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                </Routes>
            </div>

            {/* Admin Button - Bottom Left Corner, Lock Icon, Low Opacity */}
            <button 
                onClick={() => setAdminOpen(true)} 
                className="fixed bottom-4 left-4 z-50 text-stone-300 hover:text-stone-600 transition opacity-50 hover:opacity-100"
            >
                <Lock size={16} />
            </button>
            
            {/* Floating Dock: Socials & AI (Bottom Center) */}
            <FloatingDock onOpenFAQ={() => setFaqOpen(true)} />

            <footer className="py-12 text-center border-t border-stone-100 mt-12 pb-32">
                <h4 className="font-outfit font-bold text-xl">STILLS<span className="font-normal text-stone-400">by</span>HEUM</h4>
                {/* Icons removed from here, now in FloatingDock */}
                <div className="h-6" /> 
                <VisitorCounter />
            </footer>

            <AdminModal isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
            <FAQWidget isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
            <AlbumDetail />
            <ImageViewer />
        </div>
    );
};

const App: React.FC = () => (
    <AppProvider>
        <Router>
            <AppContent />
        </Router>
    </AppProvider>
);

export default App;