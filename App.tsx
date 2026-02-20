import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, MotionValue, AnimatePresence, Reorder } from 'framer-motion';
import { Globe, User, Lock, Calendar as CalendarIcon, MessageCircle, ChevronRight, ChevronLeft, Instagram, X as CloseIcon, Star, Trash2, Plus, Play, Pause, MapPin, ArrowRight, Bot, Check, Send, Save, Menu, Smile, Download } from 'lucide-react';
import { Language, DaySchedule, ContentData, AdminUser, NoticeItem, Review, PortfolioAlbum, FAQItem, AILog } from './types';
import { INITIAL_CONTENT, DEFAULT_SLOTS, ENCRYPTED_ADMIN_ID, ENCRYPTED_ADMIN_PW, INITIAL_REVIEWS } from './constants';
import { generateResponse } from './services/geminiService';
import html2canvas from 'html2canvas';

// --- Context Setup ---

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentData;
  updateContent: (key: keyof ContentData, subKey: string, value: any) => void;
  reviews: Review[];
  isPlaying: boolean;
  toggleAudio: () => void;
  selectedAlbum: PortfolioAlbum | null;
  setSelectedAlbum: (album: PortfolioAlbum | null) => void;
  viewingImage: string | null;
  setViewingImage: (url: string | null) => void;
  logAIInteraction: (question: string, answer: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [content, setContent] = useState<ContentData>(INITIAL_CONTENT);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persistence & Auto-Review Logic
  useEffect(() => {
      const savedContent = localStorage.getItem('heum_content');
      const savedReviews = localStorage.getItem('heum_reviews');
      const lastReviewGen = localStorage.getItem('heum_last_review_gen');

      if (savedContent) setContent(JSON.parse(savedContent));
      if (savedReviews) setReviews(JSON.parse(savedReviews));

      // Auto-generate reviews every 3 days
      const now = Date.now();
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (!lastReviewGen || now - parseInt(lastReviewGen) > threeDays) {
          const newReview: Review = {
              id: Date.now().toString(),
              author: "Guest User",
              content: "Absolutely loved the session! The photos captured the London vibe perfectly. Highly recommend Heum for anyone visiting.",
              date: new Date().toISOString().split('T')[0],
              rating: 5,
              email: "guest@example.com",
              photos: []
          };
          setReviews(prev => {
              const updated = [newReview, ...prev];
              localStorage.setItem('heum_reviews', JSON.stringify(updated));
              return updated;
          });
          localStorage.setItem('heum_last_review_gen', now.toString());
      }
  }, []);

  const saveToLocalStorage = () => {
      localStorage.setItem('heum_content', JSON.stringify(content));
      localStorage.setItem('heum_reviews', JSON.stringify(reviews));
      alert("Data saved successfully!");
  };

  const tryPlay = useCallback(() => {
    if (audioRef.current) {
         audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, []);

  useEffect(() => {
    const rawUrl = INITIAL_CONTENT.backgroundMusicUrl;
    if (rawUrl.length > 5) {
        const audio = new Audio(rawUrl);
        audio.loop = true; audio.volume = 0.5;
        audioRef.current = audio;
        tryPlay();
    }
  }, [tryPlay]);

  const logAIInteraction = (question: string, answer: string) => {
      const newLog: AILog = { id: Date.now().toString(), timestamp: new Date().toLocaleString(), question, answer };
      setContent(prev => ({ ...prev, aiLogs: [newLog, ...(prev.aiLogs || [])].slice(0, 50) }));
  };

  const updateContent = (key: keyof ContentData, subKey: string, value: any) => {
      setContent(prev => {
          if (subKey && typeof prev[key] === 'object' && !Array.isArray(prev[key])) {
              return { ...prev, [key]: { ...prev[key], [subKey]: value } };
          }
          return { ...prev, [key]: value };
      });
  };

  // Helper to update reviews from Admin
  const updateReviews = (newReviews: Review[]) => {
      setReviews(newReviews);
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage, content, updateContent,
      reviews, isPlaying, toggleAudio: () => {
          if (audioRef.current) {
              if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
              setIsPlaying(!isPlaying);
          }
      },
      selectedAlbum, setSelectedAlbum, viewingImage, setViewingImage,
      logAIInteraction,
      saveToLocalStorage,
      updateReviews
    } as any}>
      {children}
    </AppContext.Provider>
  );
};

// --- Components ---

const SplashScreen: React.FC<{ onFinish: () => void; isFinishing: boolean }> = ({ onFinish, isFinishing }) => {
    useEffect(() => { const timer = setTimeout(() => onFinish(), 2200); return () => clearTimeout(timer); }, [onFinish]);
    return (
        <div className={`fixed inset-0 z-[99999] bg-white flex items-center justify-center transition-opacity duration-1000 ${isFinishing ? 'pointer-events-none' : ''}`}>
             <h1 className={`flex items-baseline gap-1 tracking-tighter ${isFinishing ? 'animate-disperse' : ''}`}>
                <span className="text-4xl md:text-6xl font-black font-outfit text-stone-900">STILLS</span>
                <span className="text-4xl md:text-6xl font-light font-outfit text-stone-900">by</span>
                <span className="text-4xl md:text-6xl font-black font-outfit text-stone-900">HEUM</span>
            </h1>
        </div>
    );
};

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
};

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white mb-12">
        <iframe src='https://my.spline.design/distortingtypography-PrREx0Qo4PCMDVyAYxd6bmrd/' frameBorder='0' width='100%' height='100%' className="absolute inset-0 w-full h-full pointer-events-auto" title="Hero 3D Scene" />
        {/* Increased gradient height from 40vh to 60vh for more occlusion */}
        <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-white via-white/95 to-transparent z-10 pointer-events-none" />
    </section>
  );
};

const SimpleSmile: React.FC<{ size?: number, className?: string }> = ({ size = 24, className = "" }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
);

const Navigation: React.FC<{ isMenuOpen: boolean; setIsMenuOpen: (isOpen: boolean) => void }> = ({ isMenuOpen, setIsMenuOpen }) => {
    const location = useLocation();
    const { content, language, setLanguage } = useAppContext();
    const [isRotating, setIsRotating] = useState(false);

    const handleLanguageChange = () => {
        setIsRotating(true);
        setLanguage(language === 'ko' ? 'en' : 'ko');
        setTimeout(() => setIsRotating(false), 500); // Duration of rotation
    };

    return (
        <>
            {/* Main Top Nav - Fixed at top */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[8000] flex items-center justify-center w-full max-w-4xl px-4 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1 p-1.5 bg-white/60 backdrop-blur-xl rounded-full shadow-lg border border-white/40 font-outfit">
                    <Link to="/" className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all ${location.pathname === '/' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:bg-white/50'}`}>STILLS</Link>
                    <Link to="/info" className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all ${location.pathname === '/info' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:bg-white/50'}`}>PRODUCT</Link>
                    <Link to="/reviews" className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all ${location.pathname === '/reviews' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:bg-white/50'}`}>REVIEW</Link>
                    <button onClick={handleLanguageChange} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-all text-stone-500" style={{ perspective: '1000px' }}>
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
                            <span>BOOKING</span>
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

const FloatingDock: React.FC<{ onOpenFAQ: () => void; onToggleMenu: () => void }> = ({ onOpenFAQ, onToggleMenu }) => {
    return (
        <>
            {/* Admin Button - Bottom Left */}
            <div className="fixed bottom-2 left-2 z-[8000]">
                <Link to="/admin" className="w-8 h-8 flex items-center justify-center text-stone-300/30 hover:text-stone-400 transition-all">
                    <Lock size={12} />
                </Link>
            </div>

            {/* Counters - Bottom Right (Mock Data) - Hidden for now */}
            {/* <div className="fixed bottom-8 right-8 z-[8000] flex flex-col items-end gap-1 pointer-events-none mix-blend-difference text-white">
                <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
                    <span>TODAY</span>
                    <span className="font-bold">128</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
                    <span>TOTAL</span>
                    <span className="font-bold">15,402</span>
                </div>
            </div> */}

            {/* Center Dock */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[8000] pointer-events-none flex items-center gap-3">
                <div className="pointer-events-auto transition-all animate-spring-up hover:scale-105 active:scale-95">
                    <button onClick={onOpenFAQ} className="flex items-center gap-2 px-5 py-2.5 glass-heavy rounded-full font-black text-[12px] uppercase tracking-tighter font-outfit hover:bg-white/60 transition shadow-lg border border-white/40 text-stone-900">
                        <SimpleSmile size={20} className="text-black" />
                        <span>HEUM's AI</span>
                    </button>
                </div>
                <div className="pointer-events-auto transition-all animate-spring-up hover:scale-105 active:scale-95 relative">
                    <button onClick={onToggleMenu} className="flex items-center justify-center w-[42px] h-[42px] glass-heavy rounded-full hover:bg-white/60 transition shadow-lg border border-white/40 text-stone-900">
                        <CalendarIcon size={18} />
                    </button>
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-bounce shadow-sm" />
                </div>
            </div>
        </>
    );
};

const FAQWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { content, language, logAIInteraction } = useAppContext();
    const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([{ role: 'bot', text: language === 'ko' ? "안녕하세요! 흠작가님의 AI 매니저입니다. 궁금하신 점을 물어보세요." : "Hello! I'm Heum's AI Manager. How can I help you today?" }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;
        setMessages(prev => [...prev, { role: 'user', text }]); setInput(""); setLoading(true);
        const response = await generateResponse(text, content.aiContext, content);
        setMessages(prev => [...prev, { role: 'bot', text: response }]);
        logAIInteraction(text, response); setLoading(false);
    };

    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 z-[8999] bg-black/20 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9000] w-[90vw] md:w-[380px] h-[60vh] glass-heavy rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col overflow-hidden animate-ios-open">
                <div className="bg-white/50 backdrop-blur-md p-5 flex justify-between items-center shrink-0 border-b border-white/20">
                    <div className="flex items-center gap-2">
                        <SimpleSmile size={24} className="text-black" />
                        <span className="font-bold text-[11px] tracking-widest uppercase text-stone-800">Heum's AI</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><CloseIcon size={20} className="text-stone-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={scrollRef}>
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-[1.2rem] text-xs leading-relaxed font-medium ${m.role === 'user' ? 'bg-black text-white rounded-tr-none shadow-md' : 'bg-white/80 border border-white/50 text-stone-800 shadow-sm rounded-tl-none'}`}>{m.text}</div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/60 border border-white/40 px-4 py-3 rounded-[1.2rem] rounded-tl-none shadow-sm flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-white/60 backdrop-blur-md border-t border-white/30 flex gap-2 items-center">
                    <input className="flex-1 bg-white/70 border border-white/50 rounded-full px-5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium placeholder:text-stone-400" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"><Send size={16} /></button>
                </div>
            </div>
        </>
    );
};

const PortfolioStrip: React.FC<{ album: PortfolioAlbum, duration: number }> = ({ album, duration }) => {
    const { setSelectedAlbum } = useAppContext();
    const displayImages = [...album.images, ...album.images].slice(0, 15); 
    return (
        <div className="relative w-full py-8 overflow-hidden bg-white border-b border-stone-100 group">
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-6">
                <div className="pointer-events-auto cursor-pointer flex justify-center" onClick={() => setSelectedAlbum(album)}>
                    {/* Added text-center to h3 to ensure alignment for wrapped text like "Event & Graduation" */}
                    <h3 className="text-6xl md:text-[10rem] font-black font-outfit text-white relative z-50 tracking-tighter uppercase drop-shadow-2xl hover:scale-110 transition-transform duration-[1500ms] text-center leading-tight">
                         {album.title.en}
                    </h3>
                </div>
            </div>
            <div className="flex gap-8 animate-marquee w-max px-8 items-center" style={{ animationDuration: `${duration}s` }}>
                {displayImages.map((img, idx) => (
                    <div key={`${album.id}-${idx}`} onClick={() => setSelectedAlbum(album)} className="relative shrink-0 rounded-[2rem] overflow-hidden cursor-pointer w-[85vw] h-auto aspect-[3/4] md:w-auto md:h-[70vh] md:aspect-[3/4] shadow-xl hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)] transition-all duration-1000">
                        <img src={img} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" alt="Portfolio" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminPage: React.FC = () => {
    const { content, updateContent, saveToLocalStorage, reviews, updateReviews } = useAppContext();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState<'general' | 'packages' | 'notices' | 'portfolio' | 'reviews'>('general');

    const handleLogin = () => {
        if (btoa(password) === ENCRYPTED_ADMIN_PW) setIsAuthenticated(true);
        else alert("Incorrect password");
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 pt-20">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-100">
                    <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 border border-stone-200 rounded-xl mb-4 focus:ring-2 focus:ring-black outline-none transition-all" placeholder="Enter Password" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                    <button onClick={handleLogin} className="w-full bg-black text-white p-4 rounded-xl font-bold hover:scale-[1.02] transition-transform">Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <div className="flex gap-2">
                    <button onClick={saveToLocalStorage} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg">
                        <Save size={18} />
                        <span>Save Changes</span>
                    </button>
                    <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 bg-stone-200 text-stone-600 px-6 py-3 rounded-xl font-bold hover:bg-stone-300 transition-colors">
                        <span>Exit</span>
                    </button>
                </div>
            </div>
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
                {['general', 'packages', 'notices', 'portfolio', 'reviews', 'schedule'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-full font-bold capitalize transition-all ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'}`}>{tab}</button>
                ))}
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
                {activeTab === 'schedule' && (
                    <div className="space-y-8">
                        <div className="bg-stone-50 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4">Manage Schedule</h3>
                            <p className="text-sm text-stone-500 mb-6">Select a date to block/unblock specific time slots.</p>
                            {/* Simple Date Picker for Admin */}
                            <input 
                                type="date" 
                                className="p-3 border rounded-xl mb-6" 
                                onChange={(e) => {
                                    // Just a simple way to pick a date to edit
                                    // In a real app, a full calendar UI would be better
                                    const date = e.target.value;
                                    if (!date) return;
                                    
                                    // Check if schedule exists for this date
                                    const existingSchedule = content.schedule?.find(s => s.date === date);
                                    if (!existingSchedule) {
                                        // Create new schedule entry if not exists
                                        const newSchedule = [...(content.schedule || [])];
                                        newSchedule.push({
                                            date: date,
                                            slots: DEFAULT_SLOTS.map(time => ({ id: `${date}-${time}`, time, isBooked: false, isBlocked: false }))
                                        });
                                        updateContent('schedule', '', newSchedule);
                                    }
                                }}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {content.schedule?.map((daySchedule, dIdx) => (
                                    <div key={daySchedule.date} className="bg-white p-4 rounded-xl border border-stone-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold">{daySchedule.date}</h4>
                                            <button onClick={() => {
                                                const newSchedule = content.schedule.filter((_, i) => i !== dIdx);
                                                updateContent('schedule', '', newSchedule);
                                            }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {daySchedule.slots.map((slot, sIdx) => (
                                                <button 
                                                    key={slot.id}
                                                    onClick={() => {
                                                        const newSchedule = [...content.schedule];
                                                        newSchedule[dIdx].slots[sIdx].isBlocked = !newSchedule[dIdx].slots[sIdx].isBlocked;
                                                        updateContent('schedule', '', newSchedule);
                                                    }}
                                                    className={`text-xs py-2 rounded-lg font-bold transition-colors ${
                                                        slot.isBlocked 
                                                        ? 'bg-red-100 text-red-600 border border-red-200' 
                                                        : 'bg-stone-50 text-stone-600 border border-stone-100 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'general' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Hero Section</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-xs font-bold mb-2 uppercase text-stone-400">Title (EN)</label><input value={content.heroTitle.en} onChange={(e) => updateContent('heroTitle', 'en', e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50" /></div>
                                <div><label className="block text-xs font-bold mb-2 uppercase text-stone-400">Title (KO)</label><input value={content.heroTitle.ko} onChange={(e) => updateContent('heroTitle', 'ko', e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50" /></div>
                                <div><label className="block text-xs font-bold mb-2 uppercase text-stone-400">Subtitle (EN)</label><input value={content.heroSubtitle.en} onChange={(e) => updateContent('heroSubtitle', 'en', e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50" /></div>
                                <div><label className="block text-xs font-bold mb-2 uppercase text-stone-400">Subtitle (KO)</label><input value={content.heroSubtitle.ko} onChange={(e) => updateContent('heroSubtitle', 'ko', e.target.value)} className="w-full p-3 border rounded-xl bg-stone-50" /></div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-4">AI Context</h3>
                            <textarea value={content.aiContext} onChange={(e) => updateContent('aiContext', '', e.target.value)} className="w-full p-4 border rounded-xl bg-stone-50 h-32" />
                        </div>
                    </div>
                )}
                {activeTab === 'packages' && (
                    <div className="space-y-8">
                        {content.packages.map((pkg, idx) => (
                            <div key={pkg.id} className="p-6 border border-stone-100 rounded-2xl bg-stone-50">
                                <h4 className="font-bold mb-4 uppercase text-stone-400">{pkg.id} Package</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input value={pkg.title.en} onChange={(e) => { const newPkgs = [...content.packages]; newPkgs[idx].title.en = e.target.value; updateContent('packages', '', newPkgs); }} className="p-3 border rounded-xl" placeholder="Title EN" />
                                    <input value={pkg.price} onChange={(e) => { const newPkgs = [...content.packages]; newPkgs[idx].price = e.target.value; updateContent('packages', '', newPkgs); }} className="p-3 border rounded-xl" placeholder="Price" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'notices' && (
                    <div className="space-y-8">
                        {content.notices.map((notice, idx) => (
                            <div key={notice.id} className="p-6 border border-stone-100 rounded-2xl bg-stone-50">
                                <h4 className="font-bold mb-4 uppercase text-stone-400">{notice.id}</h4>
                                <textarea value={notice.description.ko} onChange={(e) => { const newNotices = [...content.notices]; newNotices[idx].description.ko = e.target.value; updateContent('notices', '', newNotices); }} className="w-full p-3 border rounded-xl h-24" />
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'portfolio' && (
                    <div className="space-y-8">
                        {content.portfolio.map((album, idx) => (
                            <div key={album.id} className="p-6 border border-stone-100 rounded-2xl bg-stone-50">
                                <h4 className="font-bold mb-4 uppercase text-stone-400">{album.title.en}</h4>
                                <Reorder.Group axis="y" values={album.images} onReorder={(newImages) => {
                                    const newPortfolio = [...content.portfolio];
                                    newPortfolio[idx].images = newImages;
                                    updateContent('portfolio', '', newPortfolio);
                                }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {album.images.map((img) => (
                                        <Reorder.Item key={img} value={img} className="relative group aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing">
                                            <img src={img} className="w-full h-full object-cover pointer-events-none" alt="Portfolio" />
                                            <button onClick={() => {
                                                const newPortfolio = [...content.portfolio];
                                                newPortfolio[idx].images = newPortfolio[idx].images.filter(i => i !== img);
                                                updateContent('portfolio', '', newPortfolio);
                                            }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={14} />
                                            </button>
                                        </Reorder.Item>
                                    ))}
                                    <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:bg-stone-100 transition-colors" onClick={() => {
                                        const url = prompt("Enter image URL");
                                        if (url) {
                                            if (album.images.includes(url)) {
                                                alert("This image already exists in the album.");
                                                return;
                                            }
                                            const newPortfolio = [...content.portfolio];
                                            newPortfolio[idx].images.push(url);
                                            updateContent('portfolio', '', newPortfolio);
                                        }
                                    }}>
                                        <Plus size={24} className="text-stone-400" />
                                    </div>
                                </Reorder.Group>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button onClick={() => {
                                const newReview: Review = {
                                    id: Date.now().toString(),
                                    author: "New Reviewer",
                                    content: "Write review content here...",
                                    date: new Date().toISOString().split('T')[0],
                                    rating: 5,
                                    email: "",
                                    photos: []
                                };
                                updateReviews([newReview, ...reviews]);
                            }} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">
                                <Plus size={16} /> Add Review
                            </button>
                        </div>
                        {reviews.map((review, idx) => (
                            <div key={review.id} className="p-6 border border-stone-100 rounded-2xl bg-stone-50">
                                <div className="flex justify-between mb-4">
                                    <input value={review.author} onChange={(e) => {
                                        const newReviews = [...reviews];
                                        newReviews[idx].author = e.target.value;
                                        updateReviews(newReviews);
                                    }} className="font-bold bg-transparent border-b border-stone-300 focus:border-black outline-none" />
                                    <button onClick={() => {
                                        const newReviews = reviews.filter(r => r.id !== review.id);
                                        updateReviews(newReviews);
                                    }} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={16} /></button>
                                </div>
                                <textarea value={review.content} onChange={(e) => {
                                    const newReviews = [...reviews];
                                    newReviews[idx].content = e.target.value;
                                    updateReviews(newReviews);
                                }} className="w-full p-3 border rounded-xl bg-white mb-2" rows={3} />
                                <div className="flex gap-2">
                                    <input type="date" value={review.date} onChange={(e) => {
                                        const newReviews = [...reviews];
                                        newReviews[idx].date = e.target.value;
                                        updateReviews(newReviews);
                                    }} className="p-2 border rounded-lg text-xs" />
                                    <select value={review.rating} onChange={(e) => {
                                        const newReviews = [...reviews];
                                        newReviews[idx].rating = parseInt(e.target.value);
                                        updateReviews(newReviews);
                                    }} className="p-2 border rounded-lg text-xs">
                                        {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-bold mb-2 uppercase text-stone-400">Review Photos</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {review.photos?.map((photo, pIdx) => (
                                            <div key={pIdx} className="relative group w-16 h-16 rounded-lg overflow-hidden">
                                                <img src={photo} className="w-full h-full object-cover" alt="Review" />
                                                <button onClick={() => {
                                                    const newReviews = [...reviews];
                                                    newReviews[idx].photos = newReviews[idx].photos?.filter((_, i) => i !== pIdx);
                                                    updateReviews(newReviews);
                                                }} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => {
                                            const url = prompt("Enter image URL");
                                            if (url) {
                                                const newReviews = [...reviews];
                                                if (!newReviews[idx].photos) newReviews[idx].photos = [];
                                                newReviews[idx].photos?.push(url);
                                                updateReviews(newReviews);
                                            }
                                        }} className="w-16 h-16 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors">
                                            <Plus size={20} className="text-stone-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ReviewPage: React.FC = () => {
    const { reviews } = useAppContext();
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);

    return (
        <div className="min-h-screen pt-32 px-4 pb-32 max-w-6xl mx-auto font-sans">
            <h2 className="text-6xl font-black mb-16 text-center tracking-tighter uppercase font-outfit text-stone-900">Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviews.map(r => (
                    <div key={r.id} onClick={() => setSelectedReview(r)} className="p-6 bg-stone-50 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-500 border border-white group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="font-bold text-base tracking-tight text-stone-900">{r.author}</span>
                                <div className="flex text-yellow-500 mt-1 gap-0.5">
                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                </div>
                            </div>
                            <span className="text-[9px] font-bold text-stone-400 font-mono tracking-widest">{r.date}</span>
                        </div>
                        <p className="text-stone-600 text-xs leading-relaxed mb-4 font-medium group-hover:text-stone-800 transition-colors line-clamp-4">{r.content}</p>
                        {r.photos && r.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                {r.photos.map((p, i) => <img key={i} src={p} className="w-16 h-16 object-cover rounded-[0.8rem] shrink-0 shadow-sm hover:scale-105 transition-all" alt="Review" />)}
                            </div>
                        )}
                    </div>
                ))}
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
                            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-xl">{selectedReview.author}</h3>
                                    <div className="flex text-yellow-500 gap-0.5 mt-1">
                                        {[...Array(selectedReview.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReview(null)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
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
                                <div className="bg-stone-50 p-6 rounded-2xl">
                                    <p className="text-stone-700 leading-loose whitespace-pre-line font-medium">{selectedReview.content}</p>
                                    <p className="text-right text-xs font-bold text-stone-400 mt-4 font-mono">{selectedReview.date}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ProductCard: React.FC<{ 
    pkg: any, 
    isOpen: boolean,
    onClick: () => void
}> = ({ pkg, isOpen, onClick }) => {
    const { language } = useAppContext();
    const isDark = pkg.color.includes('bg-black') || pkg.color.includes('bg-stone-900') || pkg.title.en.includes('120');
    const textColor = isDark ? 'text-white' : 'text-stone-900';
    const subTextColor = isDark ? 'text-stone-400' : 'text-stone-500';
    const checkColor = isDark ? 'text-white' : 'text-stone-900';
    
    return (
        <motion.div 
            layout
            onClick={onClick}
            className={`w-full max-w-3xl mx-auto rounded-[2rem] p-6 md:p-8 cursor-pointer overflow-hidden ${pkg.color} border border-stone-200 shadow-lg hover:shadow-xl transition-shadow`}
            initial={{ borderRadius: "2rem" }}
        >
            <motion.div layout className="flex justify-between items-center">
                <h3 className={`text-xl md:text-3xl font-black uppercase tracking-tighter leading-tight font-outfit ${textColor}`}>
                    {pkg.title[language]}
                </h3>
                <motion.div 
                    layout
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronRight size={28} className={`${textColor} stroke-[3px]`} />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                         <p className={`text-lg md:text-xl opacity-80 mb-6 font-bold tracking-wide ${textColor}`}>{pkg.price}</p>
                         <ul className="space-y-3 text-sm md:text-base opacity-90">
                            {pkg.features[language].map((f: string, i: number) => ( 
                                <li key={i} className="flex gap-3 items-start">
                                    <Check size={18} className={`mt-1 shrink-0 stroke-[3px] ${checkColor}`}/> 
                                    <span className={`font-bold leading-relaxed ${textColor}`}>{f}</span>
                                </li> 
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const InfoPage: React.FC = () => {
    const { content, language } = useAppContext();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen pt-32 pb-32 w-full px-4"
        >
             <section className="mb-32 max-w-6xl mx-auto">
                <h2 className="text-6xl font-black mb-16 text-center uppercase tracking-tighter font-outfit text-stone-900">PRODUCTS</h2>
                <div className="flex flex-col gap-6">
                    {content.packages.map((pkg) => (
                        <ProductCard 
                            key={pkg.id} 
                            pkg={pkg} 
                            isOpen={expandedId === pkg.id}
                            onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
                        />
                    ))}
                </div>
             </section>
             
             <section className="max-w-6xl mx-auto px-4 mt-32">
                 <h2 className="text-6xl font-black mb-16 text-center uppercase tracking-tighter font-outfit text-stone-900">Protocol</h2>
                 <div className="space-y-8">
                     {content.notices.map(n => (
                         <div key={n.id} className="border-l-4 border-stone-200 pl-6 group">
                             <h4 className="font-black text-xl mb-2 text-stone-900 group-hover:text-black transition-colors">{n.title[language]}</h4>
                             <p className="text-stone-500 text-xs leading-loose whitespace-pre-line font-bold group-hover:text-stone-700 transition-colors">{n.description[language]}</p>
                         </div>
                     ))}
                 </div>
             </section>
        </motion.div>
    );
};

const ContactPage: React.FC = () => {
    const { content, language } = useAppContext();
    const [step, setStep] = useState<'date' | 'time' | 'location' | 'product' | 'details'>('date');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [formData, setFormData] = useState({ name: '', relationship: '', outfit: '', kakaoId: '', email: '', requests: '' });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const confirmationRef = useRef<HTMLDivElement>(null);

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const handleDateSelect = (d: number) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selected < today) return;

        setSelectedDate(selected);
        setSelectedTimes([]);
        setStep('time');
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTimes(prev => 
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
        );
    };

    const handleLocationSelect = (loc: string) => {
        setSelectedLocations(prev => 
            prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
        );
    };

    const handleProductSelect = (pkgId: string) => {
        setSelectedProduct(pkgId);
        setStep('details');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Basic validation: limit to 10 files and 10MB each
            const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
            if (validFiles.length !== files.length) {
                alert("Some files were skipped because they exceed the 10MB limit.");
            }
            setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10));
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getPriceDetails = () => {
        if (!selectedProduct) return { total: 0, deposit: 0, balance: 0 };
        const pkg = content.packages.find(p => p.id === selectedProduct);
        if (!pkg) return { total: 0, deposit: 0, balance: 0 };
        
        // Extract number from price string (e.g. "£300" -> 300, "300000won" -> 300000)
        const priceStr = pkg.price;
        const match = priceStr.match(/(\d[\d,]*)/);
        
        if (!match) return { total: 0, deposit: 0, balance: 0, isText: true, text: priceStr };

        const priceNum = parseInt(match[0].replace(/,/g, ''));
        
        if (isNaN(priceNum)) return { total: 0, deposit: 0, balance: 0, isText: true, text: priceStr };

        const deposit = Math.round(priceNum * 0.1);
        const balance = priceNum - deposit;
        const currency = priceStr.replace(/[\d,\s]/g, '') || '£';
        
        // Approximate KRW conversion if currency is GBP
        const krwRate = 1750;
        const totalKrw = currency.includes('£') ? priceNum * krwRate : priceNum;
        const depositKrw = Math.round(totalKrw * 0.1);
        const balanceKrw = totalKrw - depositKrw;

        return { 
            total: priceNum, deposit, balance, isText: false, currency,
            totalKrw, depositKrw, balanceKrw, showKrw: currency.includes('£')
        };
    };

    const priceDetails = getPriceDetails();

    const handleBookingSubmit = async () => {
        // Generate Image
        if (confirmationRef.current) {
            try {
                const canvas = await html2canvas(confirmationRef.current, {
                    backgroundColor: '#ffffff',
                    scale: 2
                });
                const image = canvas.toDataURL("image/png");
                const link = document.createElement('a');
                link.href = image;
                link.download = `Heum_Booking_${formData.name}_${selectedDate?.toISOString().split('T')[0]}.png`;
                link.click();
            } catch (err) {
                console.error("Failed to generate image", err);
            }
        }

        // Send to Formspree
        const formspreeData = {
            name: formData.name,
            date: selectedDate?.toLocaleDateString(),
            time: selectedTimes.join(', '),
            location: selectedLocations.join(', '),
            product: content.packages.find(p => p.id === selectedProduct)?.title[language],
            relationship: formData.relationship,
            outfit: formData.outfit,
            kakaoId: formData.kakaoId,
            email: formData.email,
            requests: formData.requests,
            priceTotal: `${priceDetails.currency}${priceDetails.total.toLocaleString()} / ₩${priceDetails.totalKrw?.toLocaleString()}`,
            priceDeposit: `${priceDetails.currency}${priceDetails.deposit.toLocaleString()} / ₩${priceDetails.depositKrw?.toLocaleString()}`,
            priceBalance: `${priceDetails.currency}${priceDetails.balance.toLocaleString()} / ₩${priceDetails.balanceKrw?.toLocaleString()}`
        };

        try {
            await fetch("https://formspree.io/f/maqddpov", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formspreeData)
            });
            alert("Your booking request has been sent successfully! The summary image has also been downloaded.");
        } catch (error) {
            console.error("Formspree Error:", error);
            alert("There was an error sending your booking. Please try again or contact us directly.");
        }

        setShowConfirmation(false);
    };

    return (
        <div className="min-h-screen pt-32 px-4 pb-32 max-w-5xl mx-auto">
             <h2 className="text-4xl font-bold mb-12 text-center tracking-tight uppercase text-stone-900">Reservation</h2>
             
             {/* Progress Steps */}
             <div className="flex justify-center mb-12 gap-2">
                {['Date', 'Time', 'Location', 'Product', 'Details'].map((s, i) => {
                    const stepIdx = ['date', 'time', 'location', 'product', 'details'].indexOf(step);
                    const isActive = i <= stepIdx;
                    return (
                        <div key={s} className="flex items-center">
                            <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-black scale-125' : 'bg-stone-200'}`} />
                            {i < 4 && <div className={`w-8 h-0.5 mx-1 transition-all ${isActive ? 'bg-black' : 'bg-stone-200'}`} />}
                        </div>
                    )
                })}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-stone-100 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <div className="flex gap-2">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {blanks.map((b, i) => <div key={`blank-${i}`} />)}
                        {days.map(d => {
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isPast = date < today;
                            
                            return (
                                <button
                                    key={d}
                                    onClick={() => !isPast && handleDateSelect(d)}
                                    disabled={isPast}
                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                        selectedDate?.getDate() === d && selectedDate?.getMonth() === currentMonth.getMonth()
                                            ? 'bg-black text-white shadow-md scale-110'
                                            : isPast 
                                                ? 'text-stone-300 cursor-not-allowed' 
                                                : 'hover:bg-stone-100 text-stone-700'
                                    }`}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 min-h-[400px] flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 'date' && (
                            <motion.div key="step-date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
                                <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center">
                                    <CalendarIcon size={32} className="text-stone-400" />
                                </div>
                                <p className="font-bold text-sm">Select a date to begin</p>
                            </motion.div>
                        )}

                        {step === 'time' && selectedDate && (
                            <motion.div key="step-time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={() => setStep('date')} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                                    <h3 className="text-xl font-bold">Select Time (London)</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {DEFAULT_SLOTS.map(slot => {
                                        const [hours, minutes] = slot.split(':').map(Number);
                                        const now = new Date();
                                        const londonTimeStr = now.toLocaleString('en-US', { timeZone: 'Europe/London' });
                                        const londonTime = new Date(londonTimeStr);
                                        const londonNowUTC = new Date(Date.UTC(londonTime.getFullYear(), londonTime.getMonth(), londonTime.getDate(), londonTime.getHours(), londonTime.getMinutes()));
                                        const bufferTimeUTC = new Date(londonNowUTC.getTime() + 3 * 60 * 60 * 1000);
                                        
                                        const slotTimeInLondon = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes));
                                        const isDisabled = slotTimeInLondon < bufferTimeUTC;
                                        
                                        // Check admin blocked slots
                                        const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD (local time, might need adjustment if timezone issues arise, but for now simple date string match)
                                        // Actually, selectedDate is a Date object. Let's format it to YYYY-MM-DD correctly using local time as the key
                                        // Since we are using simple string matching in admin, we should be consistent.
                                        // Admin uses input type="date" which returns YYYY-MM-DD.
                                        // selectedDate is created with new Date(y, m, d).
                                        const year = selectedDate.getFullYear();
                                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const day = String(selectedDate.getDate()).padStart(2, '0');
                                        const formattedDate = `${year}-${month}-${day}`;

                                        const daySchedule = content.schedule?.find(s => s.date === formattedDate);
                                        const isBlocked = daySchedule?.slots.find(s => s.time === slot)?.isBlocked;

                                        const isSelected = selectedTimes.includes(slot);

                                        return (
                                            <button 
                                                key={slot} 
                                                onClick={() => !isDisabled && !isBlocked && handleTimeSelect(slot)}
                                                disabled={isDisabled || isBlocked}
                                                className={`py-3 px-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${
                                                    isDisabled || isBlocked
                                                    ? 'bg-white/30 backdrop-blur-sm border-stone-100 text-stone-300 cursor-not-allowed'
                                                    : isSelected 
                                                        ? 'bg-black text-white border-black scale-105' 
                                                        : 'bg-white border-stone-200 hover:border-black hover:bg-black hover:text-white'
                                                }`}
                                            >
                                                {slot}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-auto pt-6 border-t border-stone-200">
                                    <button 
                                        onClick={() => setStep('location')}
                                        disabled={selectedTimes.length === 0}
                                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next Step
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'location' && (
                            <motion.div key="step-location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={() => setStep('time')} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                                    <h3 className="text-xl font-bold">Select Location (Multiple)</h3>
                                </div>
                                <div className="space-y-3">
                                    {['Big Ben & London Eye', 'Tower Bridge', 'Notting Hill', 'Shoreditch', 'Hyde Park', 'Soho'].map(loc => {
                                        const isSelected = selectedLocations.includes(loc);
                                        return (
                                            <button 
                                                key={loc} 
                                                onClick={() => handleLocationSelect(loc)}
                                                className={`w-full py-4 px-6 text-left border rounded-2xl text-sm font-bold transition-all shadow-sm flex justify-between items-center ${
                                                    isSelected 
                                                    ? 'bg-black text-white border-black scale-[1.02]' 
                                                    : 'bg-white border-stone-200 hover:border-black hover:bg-black hover:text-white'
                                                }`}
                                            >
                                                <span>{loc}</span>
                                                {isSelected && <Check size={16} />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-auto pt-6 border-t border-stone-200">
                                    <button 
                                        onClick={() => setStep('product')}
                                        disabled={selectedLocations.length === 0}
                                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next Step
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'product' && (
                            <motion.div key="step-product" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={() => setStep('location')} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                                    <h3 className="text-xl font-bold">Select Product</h3>
                                </div>
                                <div className="space-y-3">
                                    {content.packages.map(pkg => (
                                        <button 
                                            key={pkg.id} 
                                            onClick={() => handleProductSelect(pkg.id)}
                                            className={`w-full py-4 px-6 text-left border rounded-2xl text-sm font-bold transition-all shadow-sm flex justify-between items-center ${
                                                selectedProduct === pkg.id 
                                                ? 'bg-black text-white border-black scale-[1.02]' 
                                                : 'bg-white border-stone-200 hover:border-black hover:bg-black hover:text-white'
                                            }`}
                                        >
                                            <span>{pkg.title[language]}</span>
                                            {selectedProduct === pkg.id && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'details' && (
                            <motion.div key="step-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                    <button onClick={() => setStep('product')} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                                    <h3 className="text-xl font-bold">Enter Details</h3>
                                </div>
                                <div className="space-y-4 flex-1 overflow-y-auto px-1">
                                    <div className="bg-white p-6 rounded-2xl border border-stone-200 text-xs space-y-3">
                                        <div className="flex justify-between"><span className="text-stone-400">Date</span> <span className="font-bold">{selectedDate?.toLocaleDateString()}</span></div>
                                        <div className="flex justify-between"><span className="text-stone-400">Time</span> <span className="font-bold">{selectedTimes.join(', ')}</span></div>
                                        <div className="flex justify-between"><span className="text-stone-400">Location</span> <span className="font-bold">{selectedLocations.join(', ')}</span></div>
                                        <div className="flex justify-between"><span className="text-stone-400">Product</span> <span className="font-bold">{content.packages.find(p => p.id === selectedProduct)?.title[language]}</span></div>
                                        
                                        <div className="h-px bg-stone-100 my-2" />
                                        
                                        {!priceDetails.isText ? (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-stone-400">Deposit (10%)</span> 
                                                    <div className="text-right">
                                                        <span className="font-bold block">{priceDetails.currency}{priceDetails.deposit.toLocaleString()}</span>
                                                        {priceDetails.showKrw && <span className="text-[10px] text-stone-400 block">₩{priceDetails.depositKrw?.toLocaleString()}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-stone-400">Balance</span> 
                                                    <div className="text-right">
                                                        <span className="font-bold block">{priceDetails.currency}{priceDetails.balance.toLocaleString()}</span>
                                                        {priceDetails.showKrw && <span className="text-[10px] text-stone-400 block">₩{priceDetails.balanceKrw?.toLocaleString()}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-lg mt-2">
                                                    <span className="font-bold text-stone-900">Total Price</span> 
                                                    <div className="text-right">
                                                        <span className="font-black text-xl block">{priceDetails.currency}{priceDetails.total.toLocaleString()}</span>
                                                        {priceDetails.showKrw && <span className="text-xs text-stone-500 font-bold block">₩{priceDetails.totalKrw?.toLocaleString()}</span>}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex justify-between items-center text-lg mt-2"><span className="font-bold text-stone-900">Price</span> <span className="font-black text-xl">{priceDetails.text}</span></div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">Name</label>
                                        <input 
                                            placeholder="Your Name" 
                                            className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">Relationship</label>
                                        <input 
                                            placeholder="Relationship (e.g. Couple, Solo, Family)" 
                                            className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={formData.relationship}
                                            onChange={e => setFormData({...formData, relationship: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">Outfit & Props</label>
                                        <input 
                                            placeholder="Describe your outfit and props" 
                                            className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={formData.outfit}
                                            onChange={e => setFormData({...formData, outfit: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">KakaoTalk ID</label>
                                        <input 
                                            placeholder="KakaoTalk ID" 
                                            className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={formData.kakaoId}
                                            onChange={e => setFormData({...formData, kakaoId: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">Email</label>
                                        <input 
                                            placeholder="Email Address" 
                                            className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none"
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">Reference Photos</label>
                                        <div className="w-full p-4 bg-white border border-dashed border-stone-300 rounded-xl text-center cursor-pointer hover:bg-stone-50 transition-colors">
                                            <input type="file" multiple accept="image/*" className="hidden" id="file-upload" onChange={handleFileChange} />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full">
                                                <Plus size={20} className="text-stone-400" />
                                                <span className="text-xs font-bold text-stone-500">Upload Photos (Max 10MB each)</span>
                                            </label>
                                        </div>
                                        {selectedFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedFiles.map((file, idx) => (
                                                    <div key={idx} className="relative bg-stone-100 px-3 py-1 rounded-lg flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-stone-600 truncate max-w-[100px]">{file.name}</span>
                                                        <button onClick={() => removeFile(idx)} className="text-stone-400 hover:text-red-500"><CloseIcon size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-stone-500 ml-1">Special Requests</label>
                                        <textarea 
                                            placeholder="Any special requests or questions?" 
                                            className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black outline-none h-24"
                                            value={formData.requests}
                                            onChange={e => setFormData({...formData, requests: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button disabled={!formData.name || !formData.kakaoId || !formData.email} onClick={() => setShowConfirmation(true)} className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                                    Review & Send
                                </button>
                            </motion.div>
                        )}

                        {showConfirmation && (
                            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md rounded-[2rem] p-8 flex flex-col animate-fade-in">
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-center">Confirm Booking</h3>
                                <div className="flex-1 overflow-y-auto space-y-4 text-sm" ref={confirmationRef}>
                                    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                                        <div className="flex justify-center mb-6">
                                            <h4 className="text-xl font-black uppercase tracking-tighter font-outfit">Booking Summary</h4>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <h5 className="font-bold text-stone-400 uppercase text-[10px] tracking-widest border-b border-stone-100 pb-1">Schedule</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <span className="text-stone-500">Date</span> <span className="font-bold text-right">{selectedDate?.toLocaleDateString()}</span>
                                                    <span className="text-stone-500">Time</span> <span className="font-bold text-right">{selectedTimes.join(', ')}</span>
                                                    <span className="text-stone-500">Location</span> <span className="font-bold text-right">{selectedLocations.join(', ')}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <h5 className="font-bold text-stone-400 uppercase text-[10px] tracking-widest border-b border-stone-100 pb-1">Client Details</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <span className="text-stone-500">Name</span> <span className="font-bold text-right">{formData.name}</span>
                                                    <span className="text-stone-500">Contact</span> <span className="font-bold text-right">{formData.kakaoId}</span>
                                                    <span className="text-stone-500">Email</span> <span className="font-bold text-right">{formData.email}</span>
                                                    <span className="text-stone-500">Product</span> <span className="font-bold text-right">{content.packages.find(p => p.id === selectedProduct)?.title[language]}</span>
                                                </div>
                                            </div>

                                            {!priceDetails.isText && (
                                                <div className="bg-stone-50 p-4 rounded-xl space-y-2 mt-4">
                                                    <div className="flex justify-between"><span className="text-stone-500">Total</span> <span className="font-bold">{priceDetails.currency}{priceDetails.total.toLocaleString()} {priceDetails.showKrw && `(₩${priceDetails.totalKrw?.toLocaleString()})`}</span></div>
                                                    <div className="flex justify-between"><span className="text-stone-500">Deposit</span> <span className="font-bold text-yellow-600">{priceDetails.currency}{priceDetails.deposit.toLocaleString()} {priceDetails.showKrw && `(₩${priceDetails.depositKrw?.toLocaleString()})`}</span></div>
                                                    <div className="flex justify-between"><span className="text-stone-500">Balance</span> <span className="font-bold">{priceDetails.currency}{priceDetails.balance.toLocaleString()} {priceDetails.showKrw && `(₩${priceDetails.balanceKrw?.toLocaleString()})`}</span></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-8 text-center">
                                            <p className="text-[10px] text-stone-400 font-mono">STILLS BY HEUM</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-stone-500 text-center leading-relaxed px-4 pt-4">
                                        Clicking "Send" will save this summary as an image and open your email client.
                                    </p>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button onClick={() => setShowConfirmation(false)} className="flex-1 py-4 bg-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-300 transition-colors">Back</button>
                                    <button onClick={handleBookingSubmit} className="flex-[2] py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2">
                                        <Download size={18} />
                                        <span>Save & Send</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
             </div>
        </div>
    );
};

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

const AppContent: React.FC = () => {
    const { content } = useAppContext();
    const [splash, setSplash] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [contentReady, setContentReady] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const [direction, setDirection] = useState<'right' | 'left'>('right');
    const prevPathRef = useRef(location.pathname);

    const getPageIndex = (path: string) => {
        if (path === '/') return 0;
        if (path === '/info') return 1;
        if (path === '/reviews') return 2;
        if (path === '/contact') return 3;
        return 0;
    };

    useEffect(() => {
        const prevIndex = getPageIndex(prevPathRef.current);
        const currIndex = getPageIndex(location.pathname);
        setDirection(currIndex >= prevIndex ? 'right' : 'left');
        prevPathRef.current = location.pathname;
    }, [location.pathname]);

    const handleFinish = () => {
        setFinishing(true);
        setTimeout(() => {
            setSplash(false);
            setTimeout(() => setContentReady(true), 150);
        }, 1200);
    };

    return (
        <div className="font-['Asta_Sans',sans-serif] text-stone-900 bg-white min-h-screen relative selection:bg-black selection:text-white">
            {splash && <SplashScreen onFinish={handleFinish} isFinishing={finishing} />}
            
            {/* UI Layer: Navigation & Buttons are outside the animated content block to ensure they stay fixed and independent */}
            {contentReady && (
                <>
                    <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                    <FloatingDock onOpenFAQ={() => setFaqOpen(true)} onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
                </>
            )}

            {/* Main Content Layer */}
            <div className={`transition-all duration-[2000ms] ${contentReady ? 'opacity-100 animate-fade-in-slow' : 'opacity-0'}`}>
                <ScrollToTop />
                
                {/* Content Wrapper with rounded bottom and shadow to sit ON TOP of footer */}
                <div className="relative z-10 bg-white rounded-b-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-h-screen pb-20">
                    <div key={location.pathname} className={direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
                        <Routes location={location}>
                            <Route path="/" element={
                                <div className="min-h-screen bg-white pb-60">
                                    <HeroSection />
                                    {/* Reduced curvature for consistency */}
                                    <div className="flex flex-col gap-0 -mt-72 relative z-10 bg-white rounded-t-[4rem] shadow-[0_-50px_120px_rgba(0,0,0,0.12)] pt-56">
                                        {content.portfolio.map((p, i) => (
                                            <PortfolioStrip key={p.id} album={p} duration={[90,60,75,50][i] || 60} />
                                        ))}
                                    </div>
                                </div>
                            } />
                            <Route path="/info" element={<InfoPage />} />
                            <Route path="/reviews" element={<ReviewPage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/admin" element={<AdminPage />} />
                        </Routes>
                    </div>
                </div>
                
                <footer className="relative z-0 py-40 text-center -mt-40 pt-60 pb-60 bg-black text-white">
                    <h1 className="flex items-baseline justify-center gap-1 tracking-tighter">
                        <span className="text-4xl md:text-6xl font-extrabold font-outfit text-white">STILLS</span>
                        <span className="text-4xl md:text-6xl font-light font-outfit text-white">by</span>
                        <span className="text-4xl md:text-6xl font-extrabold font-outfit text-white">HEUM</span>
                    </h1>
                </footer>
            </div>
            
            <FAQWidget isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
            <AlbumDetail />
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