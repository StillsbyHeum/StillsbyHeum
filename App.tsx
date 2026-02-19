import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, Lock, Calendar as CalendarIcon, MessageCircle, Zap, ChevronRight, ChevronLeft, Instagram, X as CloseIcon, ChevronDown, ChevronUp, Star, Trash2, Plus, Play, Pause, MapPin, LogOut, ArrowRight, Image as ImageIcon, Edit2, Upload, MoveLeft, MoveRight, Settings, FileText, Bot, Eye, List, HelpCircle, Check, Map } from 'lucide-react';
import { Language, DaySchedule, ContentData, AdminUser, NoticeItem, Review, PortfolioAlbum, FAQItem, MeetingPoint, PackageItem, MenuItem, AILog } from './types';
import { INITIAL_CONTENT, DEFAULT_SLOTS, ENCRYPTED_ADMIN_ID, ENCRYPTED_ADMIN_PW, INITIAL_REVIEWS } from './constants';
import { generateResponse } from './services/geminiService';

// --- Context Setup ---

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentData;
  updateContent: (key: keyof ContentData, subKey: string, value: any) => void;
  updateCollectionItem: <T extends { id: string }>(key: keyof ContentData, item: T) => void;
  schedule: Record<string, DaySchedule>;
  toggleSlot: (date: string, slotId: string, action: 'book' | 'block', details?: any) => void;
  adminUser: AdminUser;
  loginAdmin: (email: string, password?: string) => boolean; 
  logoutAdmin: () => void;
  galleryFilter: string;
  setGalleryFilter: (id: string) => void;
  reviews: Review[];
  addReview: (review: Review) => void;
  deleteReview: (id: string) => void;
  updateReview: (review: Review) => void; 
  addPortfolioAlbum: (album: PortfolioAlbum) => void;
  addPortfolioImage: (albumId: string, imageUrl: string) => void;
  removePortfolioImage: (albumId: string, imageIndex: number) => void;
  movePortfolioImage: (albumId: string, fromIndex: number, direction: 'left' | 'right') => void;
  addFAQ: (faq: FAQItem) => void;
  updateFAQ: (faq: FAQItem) => void;
  deleteFAQ: (id: string) => void;
  // Notice Management
  addNotice: (notice: NoticeItem) => void;
  updateNotice: (notice: NoticeItem) => void;
  deleteNotice: (id: string) => void;
  
  // AI Management
  setAIContext: (newContext: string) => void;
  addAILog: (log: AILog) => void;

  isPlaying: boolean;
  toggleAudio: () => void;
  requestBooking: (date: string, slotId: string) => void;
  selectedAlbum: PortfolioAlbum | null;
  setSelectedAlbum: (album: PortfolioAlbum | null) => void;
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
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio(content.backgroundMusicUrl);
    audioRef.current.loop = true;
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
            return {
                ...prev,
                [key]: {
                    ...prevValue,
                    [subKey]: value
                }
            };
        }
        return {
            ...prev,
            [key]: value 
        };
    });
  };

  const updateCollectionItem = <T extends { id: string }>(key: keyof ContentData, item: T) => {
      setContent(prev => {
          const list = prev[key];
          if (Array.isArray(list)) {
              return {
                  ...prev,
                  [key]: list.map((i: any) => i.id === item.id ? item : i)
              };
          }
          return prev;
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
  const updateReview = (review: Review) => setReviews(prev => prev.map(r => r.id === review.id ? review : r));

  const addPortfolioAlbum = (album: PortfolioAlbum) => {
      setContent(prev => ({ ...prev, portfolio: [...prev.portfolio, album] }));
  };

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

  const movePortfolioImage = (albumId: string, fromIndex: number, direction: 'left' | 'right') => {
      setContent(prev => {
          const album = prev.portfolio.find(a => a.id === albumId);
          if (!album) return prev;

          const newImages = [...album.images];
          const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;

          if (toIndex < 0 || toIndex >= newImages.length) return prev;

          const [movedImage] = newImages.splice(fromIndex, 1);
          newImages.splice(toIndex, 0, movedImage);

          const updatedPortfolio = prev.portfolio.map(a => 
              a.id === albumId ? { ...a, images: newImages } : a
          );

          if (selectedAlbum?.id === albumId) {
              const updatedAlbum = updatedPortfolio.find(a => a.id === albumId);
              if (updatedAlbum) setSelectedAlbum(updatedAlbum);
          }

          return { ...prev, portfolio: updatedPortfolio };
      });
  };

  const addFAQ = (faq: FAQItem) => setContent(prev => ({ ...prev, faqs: [...prev.faqs, faq] }));
  const updateFAQ = (faq: FAQItem) => setContent(prev => ({ ...prev, faqs: prev.faqs.map(f => f.id === faq.id ? faq : f) }));
  const deleteFAQ = (id: string) => setContent(prev => ({ ...prev, faqs: prev.faqs.filter(f => f.id !== id) }));

  // Notice Management
  const addNotice = (notice: NoticeItem) => setContent(prev => ({ ...prev, notices: [...prev.notices, notice] }));
  const updateNotice = (notice: NoticeItem) => setContent(prev => ({ ...prev, notices: prev.notices.map(n => n.id === notice.id ? notice : n) }));
  const deleteNotice = (id: string) => setContent(prev => ({ ...prev, notices: prev.notices.filter(n => n.id !== id) }));

  // AI Management
  const setAIContext = (newContext: string) => setContent(prev => ({ ...prev, aiContext: newContext }));
  const addAILog = (log: AILog) => setContent(prev => ({ ...prev, aiLogs: [log, ...prev.aiLogs] }));

  const requestBooking = (date: string, slotId: string) => {
      toggleSlot(date, slotId, 'book');
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      content, updateContent, updateCollectionItem,
      schedule, toggleSlot,
      adminUser, loginAdmin, logoutAdmin,
      galleryFilter, setGalleryFilter,
      reviews, addReview, deleteReview, updateReview,
      addPortfolioAlbum, addPortfolioImage, removePortfolioImage, movePortfolioImage,
      addFAQ, updateFAQ, deleteFAQ,
      addNotice, updateNotice, deleteNotice,
      setAIContext, addAILog,
      isPlaying, toggleAudio,
      requestBooking,
      selectedAlbum, setSelectedAlbum
    }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Styles ---
const FOREST_GREEN = "bg-[#1a4c35]"; 
const FOREST_GREEN_BORDER = "border-[#1a4c35]";

// --- Helper Components ---

const GrainOverlay = () => (
    <>
        <div className="paper-texture" /> 
        <div className="film-grain" />
    </>
);

// Generic Editable Text Component
interface GenericEditableTextProps {
    text: string | number;
    onSave: (newVal: string) => void;
    className?: string;
    placeholder?: string;
    stopPropagation?: boolean;
}

const GenericEditableText: React.FC<GenericEditableTextProps> = ({ text, onSave, className, placeholder, stopPropagation = true }) => {
    const { adminUser } = useAppContext();

    const handleEdit = (e: React.MouseEvent) => {
        if (!adminUser.isAuthenticated) return;
        if (stopPropagation) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        const newValue = prompt(`Edit text:`, String(text));
        if (newValue !== null) {
            onSave(newValue);
        }
    };

    if (adminUser.isAuthenticated) {
        return (
            <span 
                onClick={handleEdit} 
                className={`cursor-pointer hover:bg-yellow-200/50 hover:outline-dashed hover:outline-1 hover:outline-yellow-500 rounded px-1 -mx-1 transition-colors relative group inline-block ${className}`}
                title="Click to Edit"
            >
                {text || <span className="text-gray-400 italic">{placeholder || 'Empty'}</span>}
                <span className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 bg-yellow-400 text-black text-[10px] px-1 rounded font-bold shadow-sm pointer-events-none z-10">EDIT</span>
            </span>
        );
    }
    return <span className={className}>{text}</span>;
};

// Generic Editable Image Component
interface GenericEditableImageProps {
    src: string;
    onSave: (newSrc: string) => void;
    className?: string;
    alt?: string;
}

const GenericEditableImage: React.FC<GenericEditableImageProps> = ({ src, onSave, className, alt }) => {
    const { adminUser } = useAppContext();

    const handleEdit = (e: React.MouseEvent) => {
        if (!adminUser.isAuthenticated) return;
        e.stopPropagation();
        e.preventDefault();

        const newValue = prompt("Enter new image URL:", src);
        if (newValue !== null && newValue.trim() !== "") {
            onSave(newValue);
        }
    };

    return (
        <div className={`relative group ${className}`}>
            <img src={src} className="w-full h-full object-cover" alt={alt || ""} />
            {adminUser.isAuthenticated && (
                 <button 
                    onClick={handleEdit}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs z-10"
                 >
                    <Edit2 size={16} className="mr-1" /> CHANGE IMG
                 </button>
            )}
        </div>
    );
};

// Legacy Editable Text Wrapper (Maps to content key)
interface EditableTextProps {
    valueKey: keyof ContentData;
    subKey?: 'ko' | 'en'; 
    className?: string;
    placeholder?: string;
}

const EditableText: React.FC<EditableTextProps> = ({ valueKey, subKey, className, placeholder }) => {
    const { content, updateContent, language } = useAppContext();
    const langKey = subKey || language;
    const textData = content[valueKey] as any;
    const textValue = textData && textData[langKey] ? textData[langKey] : '';

    return (
        <GenericEditableText 
            text={textValue} 
            onSave={(val) => updateContent(valueKey, langKey, val)}
            className={className}
            placeholder={placeholder}
        />
    );
};

const SplashScreen: React.FC<{ onFinish: () => void; isFinishing: boolean }> = ({ onFinish, isFinishing }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
           onFinish();
        }, 2200);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div 
            className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center transition-all duration-[1500ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${isFinishing ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
             <div className="text-white text-center">
                <h1 className="font-outfit text-4xl md:text-6xl font-bold tracking-tighter animate-pulse">
                    STILLS<span className="font-normal font-sans mx-2 text-2xl md:text-4xl align-middle text-stone-300">by</span>HEUM
                </h1>
            </div>
        </div>
    );
};

const AlbumDetail: React.FC = () => {
    const { selectedAlbum, setSelectedAlbum, updateCollectionItem, removePortfolioImage, addPortfolioImage, adminUser } = useAppContext();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!selectedAlbum) return null;

    const handleAddImage = () => {
        const url = prompt("Enter Image URL:");
        if (url) addPortfolioImage(selectedAlbum.id, url);
    };

    return (
        <div className="fixed inset-0 z-[9000] bg-white overflow-y-auto animate-fade-in">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-stone-100">
                <button onClick={() => setSelectedAlbum(null)} className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition">
                    <X size={24} />
                </button>
                <h2 className="font-outfit text-xl font-bold tracking-tight">{selectedAlbum.title.en}</h2>
                <div className="w-8"></div>
            </div>
            
            <div className="columns-1 md:columns-3 gap-4 px-4 py-8 max-w-7xl mx-auto space-y-4">
                {selectedAlbum.images.map((img, idx) => (
                    <div key={idx} className="relative group break-inside-avoid" onClick={() => setLightboxIndex(idx)}>
                        <img src={img} className="w-full rounded-lg hover:opacity-90 transition cursor-zoom-in" alt={`Album ${idx}`} />
                        {adminUser.isAuthenticated && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); removePortfolioImage(selectedAlbum.id, idx); }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
                {adminUser.isAuthenticated && (
                    <button onClick={handleAddImage} className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 transition">
                        <Plus size={32} />
                        <span className="text-xs font-bold mt-2">ADD PHOTO</span>
                    </button>
                )}
            </div>

            {/* Simple Lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[9001] bg-black flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
                    <img src={selectedAlbum.images[lightboxIndex]} className="max-w-full max-h-full object-contain p-4" alt="Fullscreen" />
                    <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full backdrop-blur-sm"><X /></button>
                </div>
            )}
        </div>
    );
};

const ReviewCard: React.FC<{ review: Review, onClick: () => void, className?: string }> = ({ review, onClick, className }) => {
    return (
        <div onClick={onClick} className={`bg-white p-4 rounded-[24px] shadow-sm border border-stone-100 flex flex-row gap-4 shrink-0 h-36 items-center relative group cursor-pointer hover:shadow-md transition-all ${className || 'w-[260px]'}`}>
             {review.photos && review.photos.length > 0 ? (
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-stone-100 relative">
                     <img 
                        src={review.photos[0]} 
                        className="w-full h-full object-cover"
                        alt="Review Thumbnail"
                     />
                     {review.photos.length > 1 && (
                         <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
                             +{review.photos.length - 1}
                         </div>
                     )}
                </div>
            ) : (
                <div className="w-16 h-16 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center text-stone-300">
                    <User size={20} />
                </div>
            )}
            
            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col">
                         <h4 className="font-bold text-xs text-stone-900 leading-none mb-1">
                             {review.author}
                         </h4>
                         <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < review.rating ? "currentColor" : "none"} />)}
                        </div>
                    </div>
                    <span className="text-[9px] text-stone-400 font-medium">
                        