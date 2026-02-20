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
  setAIQuickQuestions: (questions: string[]) => void;
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
      // 1. Initialize State
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
                  // Parsed data (User edits) MUST override initialValue for existing keys.
                  // New keys in initialValue (from code updates) will be added to the object.
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

      // 2. Ref to hold current state for event listeners
      const stateRef = useRef(state);
      useEffect(() => {
          stateRef.current = state;
      }, [state]);

      // 3. Auto-save effect with debounce
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
          }, 500); // Reduced debounce to 500ms

          return () => clearTimeout(handler);
      }, [key, state]);

      // 4. Force Save on Close (Prevent data loss)
      useEffect(() => {
          const handleBeforeUnload = () => {
              try {
                  localStorage.setItem(key, JSON.stringify(stateRef.current));
              } catch (e) {
                  console.error("Emergency save failed", e);
              }
          };
          window.addEventListener('beforeunload', handleBeforeUnload);
          return () => window.removeEventListener('beforeunload', handleBeforeUnload);
      }, [key]);

      return [state, setState];
  };

  const [language, setLanguage] = useState<Language>('ko');
  
  // Persisted States - Using the robust persistence hook
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
        audioRef.current.src = ""; // Clear src to stop loading/playing
        audioRef.current.load();
        audioRef.current = null;
    }
    
    // 2. Setup
    // CRITICAL FIX: Always use INITIAL_CONTENT.backgroundMusicUrl to ensure the valid Jazz track is used.
    // ignoring potentially broken URLs saved in content (localStorage) as user requested not to edit manually.
    const rawUrl = INITIAL_CONTENT.backgroundMusicUrl;
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
            // Add error listener to prevent "The element has no supported sources" logging as uncaught
            audio.addEventListener('error', (e) => {
                console.warn("Audio play error", audio.error);
                setIsPlaying(false);
            });
            audioRef.current = audio;
            tryPlay();
        }
    }
  }, []); // Run once on mount (ignoring content.backgroundMusicUrl changes)

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
  const setAIQuickQuestions = (questions: string[]) => setContent(prev => ({ ...prev, aiQuickQuestions: questions }));
  
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
      reviews: Array.isArray(reviews) ? reviews : [],
      addReview, deleteReview, updateReview,
      addPortfolioImage, removePortfolioImage, reorderPortfolioImages,
      setAIContext, setAIQuickQuestions, logAIInteraction, isPlaying, toggleAudio, requestBooking,
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
        <div className={`fixed inset-0 z-[99999] bg-white flex items-center justify-center transition-opacity duration-1000 ${isFinishing ? 'pointer-events-none' : ''}`}>
             <h1 className={`flex items-baseline gap-2 tracking-tighter ${isFinishing ? 'animate-disperse' : ''}`}>
                <span className="text-4xl md:text-6xl font-bold font-outfit text-stone-900">STILLS</span>
                <span className="text-2xl md:text-4xl font-light font-outfit text-stone-500 mx-1">by</span>
                <span className="text-4xl md:text-6xl font-bold font-outfit text-stone-900">HEUM</span>
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
        <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-slide-in-right">
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
        <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none" />
    </section>
  );
};

// Simplified Navigation - Floating on Top
const Navigation: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[8000] flex items-center gap-1 p-2 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20">
             {/* Brand Name on the Left - ensuring it is visible and styled */}
             <div className="pl-4 pr-2 font-outfit font-bold text-sm tracking-tighter flex items-center whitespace-nowrap">
                <span>STILLS</span>
                <span className="font-light text-black mx-0.5">by</span>
                <span>HEUM</span>
             </div>
             <div className="w-px h-4 bg-stone-300 mx-1" />

             {/* Links */}
             <Link to="/" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>STILLS</Link>
             <Link to="/info" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/info' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>PRODUCT</Link>
             <Link to="/contact" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/contact' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>BOOKING</Link>
        </nav>
    );
};

// Floating Dock for Socials & AI
const FloatingDock: React.FC<{ onOpenFAQ: () => void }> = ({ onOpenFAQ }) => {
    const { content, language, setLanguage } = useAppContext();
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
                
                {/* Language Toggle moved to Dock */}
                <div className="w-px h-5 bg-stone-300 mx-1" />
                <button 
                    onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')} 
                    className="p-2.5 bg-stone-100 rounded-full hover:bg-stone-200 text-stone-600 transition shadow-sm"
                    title={language === 'ko' ? "Switch to English" : "한국어로 변경"}
                >
                    <Globe size={20} />
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
                alert(language === 'ko' ? "예약 요청이 전송되었습니다. 이메일 답장을 기다려주세요." : "Request sent. Please wait for an email reply.");
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
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-4xl mx-auto animate-slide-in-right">
             <h2 className="text-3xl font-bold font-outfit mb-8 text-center">BOOKING</h2>
             <div className="bg-white p-6 md:p-12 rounded-3xl shadow-2xl border border-stone-100">
                <CalendarView />
             </div>
        </div>
    );
};

const FAQWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { content, language, logAIInteraction } = useAppContext();
    const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
        { role: 'bot', text: language === 'ko' ? "안녕하세요! 흠작가님의 AI 매니저입니다. 무엇을 도와드릴까요?" : "Hello! I'm Heum's AI Manager. How can I help you?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showQuickQuestions, setShowQuickQuestions] = useState(false); // Toggle state for Q&A
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;
        const userMsg = text;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);
        setShowQuickQuestions(false); // Hide Q&A on send

        const response = await generateResponse(userMsg, content.aiContext, content);
        
        setMessages(prev => [...prev, { role: 'bot', text: response }]);
        logAIInteraction(userMsg, response);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-4 z-[9000] w-[90vw] md:w-[400px] h-[60vh] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-slide-up">
            <div className="bg-black text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </div>
                    <span className="font-bold text-sm">HEUM's AI Manager</span>
                </div>
                <button onClick={onClose}><CloseIcon size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 relative" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                            m.role === 'user' 
                            ? 'bg-black text-white rounded-tr-none' 
                            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none shadow-sm'
                        }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100" />
                            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Question Container (Relative for absolute positioning of list) */}
            <div className="relative">
                 {/* Quick Questions Slide-Up Menu */}
                {showQuickQuestions && content.aiQuickQuestions && content.aiQuickQuestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] p-2 flex flex-col gap-1 max-h-[50vh] overflow-y-auto animate-slide-up z-20 rounded-t-2xl">
                        <div className="flex justify-between items-center px-2 py-1 mb-1 border-b border-stone-100">
                            <span className="text-xs font-bold text-stone-500">자주 묻는 질문</span>
                            <button onClick={() => setShowQuickQuestions(false)} className="p-1 hover:bg-stone-100 rounded-full"><CloseIcon size={14} className="text-stone-400"/></button>
                        </div>
                        {content.aiQuickQuestions.map((q, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleSend(q)}
                                disabled={loading}
                                className="w-full text-left px-3 py-3 hover:bg-stone-50 rounded-xl text-xs font-medium text-stone-700 transition flex items-center group"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-black mr-2 transition-colors"></span>
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <div className="p-3 bg-white border-t border-stone-100 flex flex-col gap-2 relative z-30">
                     {/* Toggle Button */}
                    {!showQuickQuestions && (
                        <button 
                            onClick={() => setShowQuickQuestions(true)}
                            className="self-start text-[11px] font-bold text-stone-500 hover:text-black hover:bg-stone-100 px-3 py-2 rounded-2xl border border-stone-100 transition flex items-center gap-2 mb-1"
                        >
                            <MessageCircle size={16} className="text-stone-400" />
                            <span>자주 묻는 질문 보기</span>
                        </button>
                    )}

                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-stone-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                            placeholder={language === 'ko' ? "질문을 입력하세요..." : "Type a message..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-105 transition shadow-sm"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VisitorCounter: React.FC = () => {
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
        <div className="flex flex-col items-center text-[10px] font-mono text-stone-400 gap-1 mt-8">
            <div>TODAY <span className="text-stone-900 font-bold">{todayCount}</span></div>
            <div>TOTAL <span className="text-stone-500 font-bold">{totalCount}</span></div>
        </div>
    );
};

const AdminPortfolio: React.FC = () => {
    const { content, addPortfolioImage, removePortfolioImage } = useAppContext();
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, albumId: string) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await compressImage(e.target.files[0]);
            addPortfolioImage(albumId, base64);
        }
    };
    return (
        <div className="space-y-8">
            {content.portfolio.map(album => (
                <div key={album.id} className="border p-4 rounded-xl">
                    <h3 className="font-bold text-lg mb-4">{album.title.en} ({album.title.ko})</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        {album.images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-[3/4]">
                                <img src={img} className="w-full h-full object-cover rounded-lg" alt="Portfolio" />
                                <button onClick={() => removePortfolioImage(album.id, idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                            </div>
                        ))}
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 aspect-[3/4]">
                            <Plus className="text-stone-400" />
                            <span className="text-xs text-stone-400 mt-2">Add Photo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, album.id)} />
                        </label>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AdminReviews: React.FC = () => {
    const { reviews, deleteReview } = useAppContext();
    return (
        <div className="space-y-4">
             {reviews.map(r => (
                 <div key={r.id} className="flex justify-between items-start border p-4 rounded-xl">
                     <div>
                         <div className="font-bold">{r.author} <span className="text-stone-400 font-normal text-sm">({r.date})</span></div>
                         <p className="text-sm mt-1">{r.content}</p>
                     </div>
                     <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                 </div>
             ))}
        </div>
    );
};

const AdminContentEditor: React.FC = () => {
    const { content, updateContent } = useAppContext();
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold mb-1">Artist Greeting (Korean)</label>
                <textarea className="w-full p-2 border rounded" value={content.artistGreeting.ko} onChange={e => updateContent('artistGreeting', 'ko', e.target.value)} />
            </div>
            <div>
                <label className="block text-sm font-bold mb-1">Artist Greeting (English)</label>
                <textarea className="w-full p-2 border rounded" value={content.artistGreeting.en} onChange={e => updateContent('artistGreeting', 'en', e.target.value)} />
            </div>
        </div>
    );
};

const AdminAIConfig: React.FC = () => {
    const { content, setAIContext, setAIQuickQuestions } = useAppContext();
    return (
        <div>
            <h3 className="font-bold mb-4">AI Context Configuration</h3>
            <p className="text-sm text-stone-500 mb-2">Instructions for the AI Manager (hidden from users).</p>
            <textarea className="w-full h-64 p-4 border rounded-xl font-mono text-sm" value={content.aiContext} onChange={e => setAIContext(e.target.value)} />
            
            <h3 className="font-bold mt-8 mb-4">Quick Questions (Buttons)</h3>
            <p className="text-sm text-stone-500 mb-2">List of questions shown as buttons in the chat (one per line).</p>
            <textarea 
                className="w-full h-32 p-4 border rounded-xl font-mono text-sm" 
                value={content.aiQuickQuestions?.join('\n') || ''} 
                onChange={e => setAIQuickQuestions(e.target.value.split('\n').filter(q => q.trim() !== ''))} 
            />

            <h3 className="font-bold mt-8 mb-4">Recent AI Logs</h3>
            <div className="bg-black text-white p-4 rounded-xl h-64 overflow-y-auto font-mono text-xs space-y-4">
                {content.aiLogs?.map(log => (
                    <div key={log.id} className="border-b border-stone-800 pb-2">
                        <div className="text-stone-500 mb-1">{log.timestamp}</div>
                        <div className="text-green-400">Q: {log.question}</div>
                        <div className="text-blue-400 mt-1">A: {log.answer}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { adminUser, loginAdmin, logoutAdmin, manualSave, storageWarning } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tab, setTab] = useState<'schedule' | 'portfolio' | 'reviews' | 'content' | 'ai'>('schedule');

    if (!isOpen) return null;

    if (!adminUser.isAuthenticated) {
        return (
            <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
                    <button onClick={onClose} className="absolute top-4 right-4"><CloseIcon /></button>
                    <h2 className="text-2xl font-bold mb-6">Admin Access</h2>
                    <input className="w-full p-4 bg-stone-50 rounded-xl mb-4" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <input className="w-full p-4 bg-stone-50 rounded-xl mb-6" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button onClick={() => { if (!loginAdmin(email, password)) alert('Invalid credentials'); }} className="w-full bg-black text-white py-4 rounded-xl font-bold">LOGIN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col">
            <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
                <div className="font-bold flex items-center gap-4">
                    <span>ADMIN DASHBOARD</span>
                    {storageWarning && <span className="text-red-500 bg-white px-2 py-1 rounded text-xs">STORAGE FULL</span>}
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={manualSave} className="flex items-center gap-2 hover:text-stone-300"><Save size={18} /> Save</button>
                    <button onClick={logoutAdmin} className="hover:text-stone-300">Logout</button>
                    <button onClick={onClose}><CloseIcon /></button>
                </div>
            </div>
            <div className="flex border-b shrink-0 overflow-x-auto">
                {(['schedule', 'portfolio', 'reviews', 'content', 'ai'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-6 py-4 font-bold uppercase text-sm whitespace-nowrap ${tab === t ? 'border-b-2 border-black bg-stone-50' : 'text-stone-500'}`}>
                        {t}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
                <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm p-6 min-h-full">
                    {tab === 'schedule' && <CalendarView />}
                    {tab === 'portfolio' && <AdminPortfolio />}
                    {tab === 'reviews' && <AdminReviews />}
                    {tab === 'content' && <AdminContentEditor />}
                    {tab === 'ai' && <AdminAIConfig />}
                </div>
            </div>
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
            <div key={location.pathname} className="animate-slide-in-right">
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
                <h4 className="font-outfit text-xl flex justify-center items-center gap-1.5">
                    <span className="font-bold">STILLS</span>
                    <span className="font-light text-black">by</span>
                    <span className="font-bold">HEUM</span>
                </h4>
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