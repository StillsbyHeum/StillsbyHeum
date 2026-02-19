import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, User, Lock, Calendar as CalendarIcon, MessageCircle, ChevronRight, ChevronLeft, Instagram, X as CloseIcon, ChevronDown, ChevronUp, Star, Trash2, Plus, Play, Pause, MapPin, ArrowRight, Edit2, Bot, Settings, HelpCircle, Check, Map, Sparkles, Music, Send, Save, MinusCircle, FileText, Image as ImageIcon, RefreshCw, LayoutDashboard, Type, List, LogOut, Upload, GripHorizontal, AlertCircle } from 'lucide-react';
import { Language, DaySchedule, ContentData, AdminUser, NoticeItem, Review, PortfolioAlbum, FAQItem, AILog } from './types';
import { INITIAL_CONTENT, DEFAULT_SLOTS, ENCRYPTED_ADMIN_ID, ENCRYPTED_ADMIN_PW, INITIAL_REVIEWS } from './constants';
import { generateResponse } from './services/geminiService';

// --- Helper: Image/File Compression & Conversion ---
// OPTIMIZED: Reduced maxWidth and quality to ensure data fits in localStorage (usually 5MB limit).
const compressImage = (file: File, maxWidth: number = 600, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } else {
                    resolve(img.src); // Fallback
                }
            };
            img.onerror = () => resolve("");
        };
        reader.onerror = () => resolve("");
    });
};

const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

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
  updateReview: (updatedReview: Review) => void;
  addPortfolioImage: (albumId: string, imageUrl: string) => void;
  removePortfolioImage: (albumId: string, imageIndex: number) => void;
  reorderPortfolioImages: (albumId: string, fromIndex: number, toIndex: number) => void;
  // AI Management
  setAIContext: (newContext: string) => void;
  logAIInteraction: (question: string, answer: string) => void;
  isPlaying: boolean;
  toggleAudio: () => void;
  requestBooking: (date: string, slotId: string) => void;
  selectedAlbum: PortfolioAlbum | null;
  setSelectedAlbum: (album: PortfolioAlbum | null) => void;
  viewingImage: string | null;
  setViewingImage: (url: string | null) => void;
  storageWarning: boolean;
  manualSave: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- AppProvider Implementation ---
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storageWarning, setStorageWarning] = useState(false);

  // --- PERSISTENCE HELPER (ROBUST MERGE) ---
  const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
      const [state, setState] = useState<T>(() => {
          try {
              const item = localStorage.getItem(key);
              if (item) {
                  const parsed = JSON.parse(item);
                  
                  // Safety Check: Handle Array Types specifically (e.g. reviews)
                  if (Array.isArray(initialValue)) {
                      return Array.isArray(parsed) ? parsed as T : initialValue;
                  }

                  // Object Merge Strategy:
                  // We merge initialValue (code defaults) with parsed (saved user data).
                  // Parsed data MUST override initialValue for existing keys.
                  // New keys in initialValue (from code updates) will be added.
                  if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue)) {
                      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                          return { ...initialValue, ...parsed };
                      }
                  }

                  return parsed;
              }
              return initialValue;
          } catch (e) {
              console.error("Storage parse error", e);
              return initialValue;
          }
      });

      // Auto-save effect with debounce
      useEffect(() => {
          const handler = setTimeout(() => {
              try {
                  const serialized = JSON.stringify(state);
                  localStorage.setItem(key, serialized);
                  setStorageWarning(false);
              } catch (e) {
                  console.error("Storage save failed", e);
                  // Use specific error check for quota exceeded
                  if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                      setStorageWarning(true);
                  }
              }
          }, 800); // Debounce saves by 800ms

          return () => clearTimeout(handler);
      }, [key, state]);

      return [state, setState];
  };

  const [language, setLanguage] = useState<Language>('ko');
  
  // Persisted States
  const [content, setContent] = usePersistentState<ContentData>('sbh_content', INITIAL_CONTENT);
  const [schedule, setSchedule] = usePersistentState<Record<string, DaySchedule>>('sbh_schedule', {});
  const [reviews, setReviews] = usePersistentState<Review[]>('sbh_reviews', INITIAL_REVIEWS);
  const [adminUser, setAdminUser] = usePersistentState<AdminUser>('sbh_admin', { email: '', isAuthenticated: false });

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // Audio Refs & State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scWidgetRef = useRef<any>(null);
  const [isSoundCloud, setIsSoundCloud] = useState(false);
  const [scUrl, setScUrl] = useState("");
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // --- Manual Save Function ---
  const manualSave = () => {
      try {
          localStorage.setItem('sbh_content', JSON.stringify(content));
          localStorage.setItem('sbh_schedule', JSON.stringify(schedule));
          localStorage.setItem('sbh_reviews', JSON.stringify(reviews));
          localStorage.setItem('sbh_admin', JSON.stringify(adminUser));
          setStorageWarning(false);
          alert(language === 'ko' ? "모든 변경사항이 저장되었습니다." : "All changes saved successfully.");
      } catch (e) {
          console.error("Manual save failed", e);
          setStorageWarning(true);
          alert(language === 'ko' ? "저장 실패: 용량이 부족합니다. 사진을 줄이거나 일부 삭제해주세요." : "Save Failed: Storage full. Please delete some images.");
      }
  };

  // --- Audio Logic ---
  const getCleanSoundCloudUrl = (url: string) => {
      if (!url.includes("soundcloud.com")) return url;
      try {
          const urlObj = new URL(url);
          return urlObj.origin + urlObj.pathname;
      } catch (e) {
          return url;
      }
  };

  const tryPlay = useCallback(() => {
    if (isSoundCloud && scWidgetRef.current && isWidgetReady) {
         scWidgetRef.current.play();
    } else if (audioRef.current) {
         const playPromise = audioRef.current.play();
         if (playPromise !== undefined) {
             playPromise
                .then(() => setIsPlaying(true))
                .catch(e => {
                    // Expected behavior if no interaction yet
                    setIsPlaying(false);
                });
         }
    }
  }, [isSoundCloud, isWidgetReady]);

  // Global Click Listener for Music Autoplay
  useEffect(() => {
    const handleInteraction = () => {
        if (!isPlaying) {
            tryPlay();
        }
    };
    
    // Listen to any interaction to trigger audio
    window.addEventListener('click', handleInteraction, { once: false });
    window.addEventListener('touchstart', handleInteraction, { once: false });
    window.addEventListener('keydown', handleInteraction, { once: false });
    window.addEventListener('scroll', handleInteraction, { once: false });

    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('scroll', handleInteraction);
    };
  }, [isPlaying, tryPlay]);

  useEffect(() => {
    // 1. Cleanup
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    
    // 2. Setup
    const rawUrl = content.backgroundMusicUrl || "";
    const isSC = rawUrl.includes("soundcloud.com");
    setIsSoundCloud(isSC);
    setIsPlaying(false);
    setIsWidgetReady(false);

    if (!rawUrl) return;

    if (isSC) {
        setScUrl(getCleanSoundCloudUrl(rawUrl));
    } else {
        // Only create Audio if URL is not empty and likely valid
        if (rawUrl.length > 5) {
            const audio = new Audio(rawUrl);
            audio.loop = true;
            audio.volume = 0.5;
            audioRef.current = audio;
            tryPlay();
        }
    }
  }, [content.backgroundMusicUrl]); 

  // SC Widget Setup
  useEffect(() => {
    if (isSoundCloud && scUrl) {
        const iframe = document.getElementById('sc-player') as HTMLIFrameElement;
        if (iframe && (window as any).SC) {
            const widget = (window as any).SC.Widget(iframe);
            scWidgetRef.current = widget;

            const onReady = () => {
                setIsWidgetReady(true);
                widget.setVolume(50);
                widget.play();
            };
            const onPlay = () => setIsPlaying(true);
            const onPause = () => setIsPlaying(false);
            const onFinish = () => { widget.seekTo(0); widget.play(); };

            widget.bind((window as any).SC.Widget.Events.READY, onReady);
            widget.bind((window as any).SC.Widget.Events.PLAY, onPlay);
            widget.bind((window as any).SC.Widget.Events.PAUSE, onPause);
            widget.bind((window as any).SC.Widget.Events.FINISH, onFinish);
        }
    }
  }, [isSoundCloud, scUrl]);

  const toggleAudio = useCallback(() => {
    if (isSoundCloud && scWidgetRef.current) {
        scWidgetRef.current.toggle();
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isSoundCloud]);

  // --- Content Update Helpers ---

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
  const updateReview = (updatedReview: Review) => {
      setReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
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

  const reorderPortfolioImages = (albumId: string, fromIndex: number, toIndex: number) => {
      setContent(prev => {
          const updatedPortfolio = prev.portfolio.map(a => {
              if (a.id === albumId) {
                  const newImages = [...a.images];
                  const [movedItem] = newImages.splice(fromIndex, 1);
                  newImages.splice(toIndex, 0, movedItem);
                  return { ...a, images: newImages };
              }
              return a;
          });
          if (selectedAlbum?.id === albumId) {
              const updatedAlbum = updatedPortfolio.find(a => a.id === albumId);
              if (updatedAlbum) setSelectedAlbum(updatedAlbum);
          }
          return { ...prev, portfolio: updatedPortfolio };
      });
  };

  const setAIContext = (newContext: string) => setContent(prev => ({ ...prev, aiContext: newContext }));
  
  const logAIInteraction = (question: string, answer: string) => {
      const newLog: AILog = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString(),
          question,
          answer
      };
      setContent(prev => ({
          ...prev,
          aiLogs: [newLog, ...(prev.aiLogs || [])].slice(0, 50) 
      }));
  };

  const requestBooking = (date: string, slotId: string) => { toggleSlot(date, slotId, 'book'); };

  return (
    <AppContext.Provider value={{
      language, setLanguage, content, updateContent, updateCollectionItem, addCollectionItem, removeCollectionItem,
      schedule, toggleSlot, adminUser, loginAdmin, logoutAdmin,
      reviews, addReview, deleteReview, updateReview,
      addPortfolioImage, removePortfolioImage, reorderPortfolioImages,
      setAIContext, logAIInteraction, isPlaying, toggleAudio, requestBooking,
      selectedAlbum, setSelectedAlbum,
      viewingImage, setViewingImage, storageWarning, manualSave
    }}>
      {children}
      {isSoundCloud && (
          <iframe
              id="sc-player"
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&auto_play=true&show_artwork=false&visual=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false`}
              style={{ position: 'fixed', bottom: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }} 
          />
      )}
    </AppContext.Provider>
  );
};

// --- Styles & Helpers ---
const FOREST_GREEN = "bg-[#1a4c35]"; 

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
    const { selectedAlbum, setSelectedAlbum, setViewingImage } = useAppContext();

    if (!selectedAlbum) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-fade-in">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-stone-100">
                <button onClick={() => setSelectedAlbum(null)} className="p-2 rounded-full hover:bg-stone-100"><CloseIcon size={24} /></button>
                <h2 className="font-outfit text-xl font-bold">{selectedAlbum.title.en}</h2>
                <div className="w-8"></div>
            </div>
            <div className="columns-1 md:columns-3 gap-4 px-4 py-8 max-w-7xl mx-auto space-y-4">
                {selectedAlbum.images.map((img, idx) => (
                    <div key={idx} className="relative group break-inside-avoid" onClick={() => setViewingImage(img)}>
                        <img src={img} className="w-full rounded-lg hover:opacity-90 transition cursor-zoom-in" alt={`Album ${idx}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Simple Single Image Lightbox
const ImageViewer: React.FC = () => {
    const { viewingImage, setViewingImage } = useAppContext();
    if (!viewingImage) return null;

    return (
        <div className="fixed inset-0 z-[99995] bg-black/95 flex items-center justify-center animate-fade-in" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} className="max-w-full max-h-screen object-contain p-4 transition-transform duration-300 scale-100" />
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 backdrop-blur-sm">
                <CloseIcon size={24} />
            </button>
        </div>
    );
};

// Hero Section (3D Spline Restored)
const HeroSection: React.FC = () => {
  const { content, language } = useAppContext();
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
                <div className="text-stone-500 font-medium tracking-wide text-sm md:text-base bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/40">
                    {content.heroSubtitle[language]}
                </div>
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
    const { language, setSelectedAlbum, setViewingImage } = useAppContext();
    const displayImages = [...album.images, ...album.images, ...album.images].slice(0, 15); 
    const fallbackImage = album.cover;

    return (
        <div className="relative w-full h-auto py-4 overflow-hidden bg-white border-b border-stone-100 last:border-0 group/strip">
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="bg-white/80 backdrop-blur-sm px-8 py-3 rounded-full shadow-sm border border-white/50 pointer-events-auto cursor-pointer hover:scale-105 transition transform flex flex-col items-center gap-2" onClick={() => setSelectedAlbum(album)}>
                    <h3 className="text-xs md:text-sm font-bold tracking-widest text-black uppercase font-outfit relative group/title">
                         <span className="relative z-50">{album.title[language]}</span>
                    </h3>
                </div>
            </div>

            <div 
                className={`flex gap-4 animate-marquee w-max px-4 items-center`}
                style={{ animationDuration: `${duration}s` }}
            >
                {(displayImages.length > 0 ? displayImages : [fallbackImage, fallbackImage, fallbackImage, fallbackImage]).map((img, idx) => (
                    <div 
                        key={`${album.id}-${idx}`} 
                        onClick={() => setViewingImage(img)}
                        className={`
                            relative shrink-0 rounded-lg overflow-hidden cursor-pointer
                            w-[85vw] h-auto aspect-[3/4] 
                            md:w-auto md:h-[60vh] md:aspect-[3/4]
                        `}
                    >
                        <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
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
    const orderedIds = ['wedding', 'couple', 'solo', 'event'];
    const durations = [60, 40, 50, 30]; 

    return (
        <div className="min-h-screen bg-white pb-20">
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
    const { reviews } = useAppContext();
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
                    </div>
                ))}
            </div>
        </section>
    );
};

const InfoPage: React.FC = () => {
    const { content, language } = useAppContext();
    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-4xl mx-auto space-y-24">
             <section className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">Artist</h2>
                <p className="text-xl md:text-2xl leading-relaxed font-light whitespace-pre-line">{content.artistGreeting[language]}</p>
             </section>

             <section>
                <h2 className="text-3xl font-bold font-outfit mb-8 text-center">PACKAGES</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.packages.map(pkg => (
                        <div key={pkg.id} className={`p-8 rounded-3xl border relative overflow-hidden group ${pkg.color} min-h-[300px]`}>
                            <h3 className="text-2xl font-bold mb-2">{pkg.title[language]}</h3>
                            <p className="text-lg opacity-70 mb-6">{pkg.price}</p>
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
                             <h4 className="font-bold text-lg mb-2">{n.title[language]}</h4>
                             <p className="text-stone-600 whitespace-pre-line">{n.description[language]}</p>
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
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Helper to get local YYYY-MM-DD string
    const getLocalDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const d = new Date(); d.setDate(d.getDate() + 1);
        setSelectedDate(getLocalDateStr(d));
    }, []);

    const getCalendarCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayIndex = firstDayOfMonth.getDay(); 
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
        setSubmitStatus('loading');
        setErrorMessage('');

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
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setSubmitStatus('success');
                alert(language === 'ko' ? "예약 요청이 전송되었습니다." : "Request sent.");
                selectedTimeSlots.forEach(t => requestBooking(selectedDate, t));
                setBookingForm(null);
                setSelectedTimeSlots([]);
                setSelectedLocations([]);
            } else {
                setSubmitStatus('error');
                const data = await response.json();
                setErrorMessage(data.error || (language === 'ko' ? "알 수 없는 오류" : "Unknown Error"));
            }
        } catch (error) {
             setSubmitStatus('error');
             setErrorMessage(language === 'ko' ? "네트워크 오류" : "Network Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSlotDisabled = (dateStr: string, timeStr: string) => {
        const slotDate = new Date(`${dateStr}T${timeStr}`);
        const now = new Date();
        const fourHoursLater = new Date(now.getTime() + (4 * 60 * 60 * 1000));

        if (slotDate < fourHoursLater) return true;
        const dayOfWeek = slotDate.getDay(); 
        if (dayOfWeek === 6) {
            const hour = parseInt(timeStr.split(':')[0]);
            if (hour > 14) return true;
        }
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const hour = parseInt(timeStr.split(':')[0]);
            if (hour < 7 || hour > 16) return true;
        }
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
                    else if (isSunday) className += "text-red-300 cursor-not-allowed bg-red-50/50 "; 
                    else className += "hover:bg-stone-100 text-stone-600 ";

                    return (
                        <button 
                            key={dateStr} 
                            disabled={isPast || isSunday}
                            onClick={() => {setSelectedDate(dateStr); setSelectedTimeSlots([]);}} 
                            className={className}
                        >
                            <span className="text-sm font-bold">{day.getDate()}</span>
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
                {DEFAULT_SLOTS.map(time => {
                    const isBlocked = schedule[selectedDate]?.slots.find(s=>s.time===time)?.isBlocked;
                    const isBooked = schedule[selectedDate]?.slots.find(s=>s.time===time)?.isBooked;
                    const isConstraintDisabled = isSlotDisabled(selectedDate, time);
                    const isSel = selectedTimeSlots.includes(time);
                    
                    const disabled = !adminUser.isAuthenticated && (isBlocked || isBooked || isConstraintDisabled);

                    let btnClass = "py-3 text-sm border rounded-xl transition font-medium ";
                    if (isBlocked && adminUser.isAuthenticated) btnClass += "bg-red-100 text-red-500 border-red-200 line-through ";
                    else if (isBooked && adminUser.isAuthenticated) btnClass += "bg-blue-100 text-blue-500 border-blue-200 ";
                    else if (isSel) btnClass += "bg-green-800 text-white border-green-800 shadow-md transform scale-105 ";
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

            {selectedTimeSlots.length > 0 && selectedLocations.length > 0 && !bookingForm && (
                <button onClick={() => setBookingForm({})} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition shadow-xl animate-fade-in">
                    NEXT STEP <ArrowRight size={16} className="inline ml-1"/>
                </button>
            )}

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
                    {submitStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-2 border border-red-100 animate-pulse">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="text-sm font-bold">{language === 'ko' ? "전송 실패: " : "Failed: "}{errorMessage}</span>
                        </div>
                    )}
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
    const { content, language, logAIInteraction } = useAppContext();
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
        // Pass the LATEST content to the AI so it knows about admin updates
        const res = await generateResponse(text, content.aiContext, content);
        setLoading(false);
        addMessage(res, 'bot');
        logAIInteraction(text, res);
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
                <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                    <div className="flex items-center gap-2">
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

// --- Full Screen Admin Dashboard ---
const AdminDashboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { adminUser, loginAdmin, logoutAdmin, content, updateContent, updateCollectionItem, addCollectionItem, removeCollectionItem, reviews, deleteReview, addReview, updateReview, addPortfolioImage, removePortfolioImage, reorderPortfolioImages, schedule, toggleSlot, setAIContext, storageWarning, manualSave } = useAppContext();
    const [creds, setCreds] = useState({ id: '', pw: '' });
    const [activeTab, setActiveTab] = useState('general');
    
    // Form States
    const [newReview, setNewReview] = useState({ author: '', content: '', rating: 5, date: new Date().toISOString().split('T')[0], photos: [] as string[] });
    const [draggedItem, setDraggedItem] = useState<{ type: string, index: number, albumId?: string } | null>(null);

    // File Upload Handler (Compressed)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            compressImage(file).then(callback);
        }
    };

    // Audio Upload Handler
    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) { // 3MB Limit
                alert("File is too large (Max 3MB). Please upload a smaller file.");
                e.target.value = ''; // Reset input
                return;
            }
            convertFileToBase64(file)
                .then(url => updateContent('backgroundMusicUrl', '', url))
                .catch(() => alert("Failed to process audio file."));
        }
    };

    // Common Input Style - Bright Yellow for Visibility
    const inputStyle = "w-full p-2.5 rounded-lg border-2 border-yellow-200 bg-yellow-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder:text-yellow-700/40 transition font-medium";
    const textareaStyle = "w-full p-2.5 rounded-lg border-2 border-yellow-200 bg-yellow-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none h-24 font-medium";

    if (!isOpen) return null;

    if (!adminUser.isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-4">
                 <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full"><CloseIcon /></button>
                 <div className="w-full max-w-sm space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl mx-auto flex items-center justify-center mb-4"><Lock size={32}/></div>
                        <h2 className="text-2xl font-bold">Admin Access</h2>
                    </div>
                    <input className="w-full p-4 bg-gray-50 rounded-xl border" placeholder="Email" onChange={e => setCreds({...creds, id: e.target.value})} />
                    <input className="w-full p-4 bg-gray-50 rounded-xl border" type="password" placeholder="Password" onChange={e => setCreds({...creds, pw: e.target.value})} />
                    <button onClick={() => { if(loginAdmin(creds.id, creds.pw)) setCreds({id:'',pw:''}); else alert('Invalid'); }} className="w-full p-4 bg-black text-white rounded-xl font-bold hover:scale-[1.02] transition">LOGIN</button>
                 </div>
            </div>
        );
    }

    const NavItem = ({ id, icon: Icon, label }: any) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === id ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col p-4">
                <div className="font-bold text-xl mb-8 px-4">SBH Admin</div>
                <div className="space-y-1 flex-1">
                    <NavItem id="general" icon={LayoutDashboard} label="General" />
                    <NavItem id="portfolio" icon={ImageIcon} label="Portfolio" />
                    <NavItem id="packages" icon={List} label="Packages" />
                    <NavItem id="notices" icon={FileText} label="Notices" />
                    <NavItem id="reviews" icon={Star} label="Reviews" />
                    <NavItem id="schedule" icon={CalendarIcon} label="Schedule" />
                    <NavItem id="settings" icon={Settings} label="Settings" />
                </div>
                {storageWarning && (
                     <div className="px-4 py-3 mb-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                        <AlertCircle size={16} /> 
                        <div>
                            <div>Storage Limit Reached!</div>
                            <div className="font-normal text-[10px]">Changes are NOT saved. Delete photos.</div>
                        </div>
                     </div>
                )}
                
                <button onClick={manualSave} className="flex items-center gap-2 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl mt-auto font-medium mb-2">
                    <Save size={18} /> Save Changes
                </button>

                <button onClick={() => { logoutAdmin(); onClose(); }} className="flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium">
                    <LogOut size={18} /> Logout
                </button>
                <button onClick={onClose} className="flex items-center gap-2 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-xl mt-2 font-medium">
                    <CloseIcon size={18} /> Close
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">General Content</h2>
                            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hero Subtitle</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input className={inputStyle} value={content.heroSubtitle.ko} onChange={e => updateContent('heroSubtitle', 'ko', e.target.value)} placeholder="KR" />
                                        <input className={inputStyle} value={content.heroSubtitle.en} onChange={e => updateContent('heroSubtitle', 'en', e.target.value)} placeholder="EN" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Artist Greeting</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <textarea className={textareaStyle} value={content.artistGreeting.ko} onChange={e => updateContent('artistGreeting', 'ko', e.target.value)} placeholder="KR" />
                                        <textarea className={textareaStyle} value={content.artistGreeting.en} onChange={e => updateContent('artistGreeting', 'en', e.target.value)} placeholder="EN" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Portfolio Management</h2>
                            {content.portfolio.map(album => (
                                <div key={album.id} className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg uppercase text-gray-400">{album.id}</h3>
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">{album.images.length} Photos</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input className={inputStyle} value={album.title.ko} onChange={e => updateCollectionItem('portfolio', {...album, title: {...album.title, ko: e.target.value}})} placeholder="Title KR" />
                                        <input className={inputStyle} value={album.title.en} onChange={e => updateCollectionItem('portfolio', {...album, title: {...album.title, en: e.target.value}})} placeholder="Title EN" />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Manage Images (Drag to Reorder)</label>
                                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
                                            {album.images.map((img, idx) => (
                                                <div 
                                                    key={idx} 
                                                    draggable
                                                    onDragStart={() => setDraggedItem({ type: 'portfolio', index: idx, albumId: album.id })}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => {
                                                        if (draggedItem?.type === 'portfolio' && draggedItem.albumId === album.id) {
                                                            reorderPortfolioImages(album.id, draggedItem.index, idx);
                                                            setDraggedItem(null);
                                                        }
                                                    }}
                                                    className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all"
                                                >
                                                    <img src={img} className="w-full h-full object-cover pointer-events-none" />
                                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition" />
                                                    <button onClick={() => removePortfolioImage(album.id, idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition shadow-md z-10"><CloseIcon size={12}/></button>
                                                </div>
                                            ))}
                                            <label className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black hover:bg-gray-100 transition">
                                                <Plus size={24} className="text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-500 mt-1">ADD PHOTO</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => addPortfolioImage(album.id, url))} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'packages' && (
                        <div className="space-y-6">
                             <h2 className="text-2xl font-bold">Packages</h2>
                             {content.packages.map(pkg => (
                                 <div key={pkg.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
                                     <div className="font-bold text-gray-400 uppercase text-xs">{pkg.id}</div>
                                     <input className={inputStyle} value={pkg.title.ko} onChange={e => updateCollectionItem('packages', {...pkg, title: {...pkg.title, ko: e.target.value}})} />
                                     <input className={inputStyle} value={pkg.price} onChange={e => updateCollectionItem('packages', {...pkg, price: e.target.value})} />
                                     <div className="grid grid-cols-2 gap-4">
                                         <textarea className={textareaStyle} value={pkg.features.ko.join('\n')} onChange={e => updateCollectionItem('packages', {...pkg, features: {...pkg.features, ko: e.target.value.split('\n')}})} />
                                         <textarea className={textareaStyle} value={pkg.features.en.join('\n')} onChange={e => updateCollectionItem('packages', {...pkg, features: {...pkg.features, en: e.target.value.split('\n')}})} />
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}

                    {activeTab === 'notices' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Notices</h2>
                            {content.notices.map(n => (
                                <div key={n.id} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
                                    <input className={inputStyle} value={n.title.ko} onChange={e => updateCollectionItem('notices', {...n, title: {...n.title, ko: e.target.value}})} />
                                    <textarea className={textareaStyle} value={n.description.ko} onChange={e => updateCollectionItem('notices', {...n, description: {...n.description, ko: e.target.value}})} />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Reviews</h2>
                            <div className="bg-white p-6 rounded-2xl border shadow-sm mb-6 bg-yellow-50/30">
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Add New Review</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <input className={inputStyle} placeholder="Author Name" value={newReview.author} onChange={e => setNewReview({...newReview, author: e.target.value})} />
                                    <input className={inputStyle} type="date" value={newReview.date} onChange={e => setNewReview({...newReview, date: e.target.value})} />
                                </div>
                                <textarea className={textareaStyle} placeholder="Review Content" value={newReview.content} onChange={e => setNewReview({...newReview, content: e.target.value})} />
                                
                                <div className="mt-4 mb-4">
                                    <div className="flex gap-2 items-center mb-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Photos attached:</label>
                                        <label className="px-3 py-1 bg-black text-white text-xs font-bold rounded cursor-pointer hover:bg-stone-800 flex items-center gap-1">
                                            <Upload size={12} /> Upload Photo
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setNewReview(prev => ({...prev, photos: [...prev.photos, url]})))} />
                                        </label>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto">
                                        {newReview.photos.map((p, i) => (
                                            <div key={i} className="relative w-16 h-16 shrink-0 group">
                                                <img src={p} className="w-full h-full object-cover rounded border" />
                                                <button onClick={() => setNewReview(prev => ({...prev, photos: prev.photos.filter((_, idx) => idx !== i)}))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full"><CloseIcon size={10}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        addReview({ id: `r${Date.now()}`, email: 'admin@added', ...newReview });
                                        setNewReview({ author: '', content: '', rating: 5, date: new Date().toISOString().split('T')[0], photos: [] });
                                        alert('Review Added');
                                    }}
                                    className="w-full py-3 bg-black text-white rounded-xl font-bold hover:scale-[1.01] transition"
                                >
                                    Publish Review
                                </button>
                            </div>
                            <div className="space-y-4">
                                {reviews.map(r => (
                                    <div key={r.id} className="bg-white p-4 rounded-xl border space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold">{r.author} <span className="text-gray-400 font-normal text-sm">{r.date}</span></div>
                                                <div className="text-sm text-gray-600 mt-1">{r.content}</div>
                                            </div>
                                            <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded shrink-0"><Trash2 size={18}/></button>
                                        </div>
                                        {/* Existing Review Photos */}
                                        {r.photos && r.photos.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pt-2 border-t border-dashed mt-2">
                                                {r.photos.map((p, i) => (
                                                    <div key={i} className="relative w-16 h-16 shrink-0 group">
                                                        <img src={p} className="w-full h-full object-cover rounded border" />
                                                        <button 
                                                            onClick={() => updateReview({...r, photos: r.photos.filter((_, idx) => idx !== i)})} 
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            <CloseIcon size={10}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-gray-50 shrink-0">
                                                    <Plus size={16} className="text-gray-400"/>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => updateReview({...r, photos: [...r.photos, url]}))} />
                                                </label>
                                            </div>
                                        )}
                                        {(!r.photos || r.photos.length === 0) && (
                                            <label className="text-xs text-blue-500 font-bold cursor-pointer hover:underline flex items-center gap-1">
                                                <Plus size={12}/> Add Photos
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => updateReview({...r, photos: [...(r.photos || []), url]}))} />
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Schedule Manager</h2>
                            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                <CalendarView />
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">System Settings</h2>
                            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Background Music URL or File (MP3 / SoundCloud)</label>
                                    <div className="flex flex-col gap-2">
                                        <input className={inputStyle} value={content.backgroundMusicUrl} onChange={e => updateContent('backgroundMusicUrl', '', e.target.value)} placeholder="https://..." />
                                        <label className="w-full flex items-center justify-center p-3 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50/50 cursor-pointer hover:bg-yellow-100 transition">
                                            <Music size={18} className="mr-2 text-yellow-700"/>
                                            <span className="text-sm font-bold text-yellow-800">Upload MP3 (Max 3MB recommended)</span>
                                            <input type="file" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">AI Context (Rules)</label>
                                    <textarea className={textareaStyle} value={content.aiContext} onChange={e => setAIContext(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold">AI Interaction Logs</h3>
                                <div className="bg-stone-900 rounded-2xl p-4 max-h-96 overflow-y-auto space-y-4">
                                    {content.aiLogs && content.aiLogs.length > 0 ? content.aiLogs.map((log, i) => (
                                        <div key={i} className="text-sm border-b border-stone-800 pb-4 last:border-0">
                                            <div className="flex justify-between text-stone-500 text-xs mb-1">
                                                <span>User Question</span>
                                                <span>{log.timestamp}</span>
                                            </div>
                                            <div className="text-white font-medium mb-2">{log.question}</div>
                                            <div className="text-green-400 text-xs mb-1">AI Answer</div>
                                            <div className="text-stone-300 leading-relaxed">{log.answer}</div>
                                        </div>
                                    )) : (
                                        <div className="text-stone-500 text-center py-8">No interactions recorded yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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

            <AdminDashboard isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
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