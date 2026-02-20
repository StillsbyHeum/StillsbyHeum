import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, User, Lock, Calendar as CalendarIcon, MessageCircle, ChevronRight, ChevronLeft, Instagram, X as CloseIcon, ChevronDown, ChevronUp, Star, Trash2, Plus, Play, Pause, MapPin, ArrowRight, Edit2, Bot, Settings, HelpCircle, Check, Map, Sparkles, Music, Send, Save, MinusCircle, FileText, Image as ImageIcon, RefreshCw, LayoutDashboard, Type, List, LogOut, Upload, GripHorizontal, AlertCircle, Menu } from 'lucide-react';
import { Language, DaySchedule, ContentData, AdminUser, NoticeItem, Review, PortfolioAlbum, FAQItem, AILog } from './types';
import { INITIAL_CONTENT, DEFAULT_SLOTS, ENCRYPTED_ADMIN_ID, ENCRYPTED_ADMIN_PW, INITIAL_REVIEWS } from './constants';
import { generateResponse } from './services/geminiService';

// --- Helper: Image/File Compression ---
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
                    resolve(img.src); 
                }
            };
            img.onerror = () => resolve("");
        };
        reader.onerror = () => resolve("");
    });
};

// --- Context Setup ---
interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentData;
  updateContent: (key: keyof ContentData, subKey: string, value: any) => void;
  adminUser: AdminUser;
  loginAdmin: (email: string, password?: string) => boolean; 
  logoutAdmin: () => void;
  reviews: Review[];
  addReview: (review: Review) => void;
  isPlaying: boolean;
  toggleAudio: () => void;
  selectedAlbum: PortfolioAlbum | null;
  setSelectedAlbum: (album: PortfolioAlbum | null) => void;
  viewingImage: string | null;
  setViewingImage: (url: string | null) => void;
  manualSave: () => void;
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
  const [adminUser, setAdminUser] = useState<AdminUser>({ email: '', isAuthenticated: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  return (
    <AppContext.Provider value={{
      language, setLanguage, content, updateContent: (k, s, v) => {},
      adminUser, loginAdmin: (e, p) => false, logoutAdmin: () => {}, 
      reviews, addReview: (r) => setReviews(prev => [r, ...prev]),
      isPlaying, toggleAudio: () => {
          if (audioRef.current) {
              if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
              setIsPlaying(!isPlaying);
          }
      },
      selectedAlbum, setSelectedAlbum, viewingImage, setViewingImage, manualSave: () => {}
    }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Sub-components ---

const SplashScreen: React.FC<{ onFinish: () => void; isFinishing: boolean }> = ({ onFinish, isFinishing }) => {
    useEffect(() => { const timer = setTimeout(() => onFinish(), 2200); return () => clearTimeout(timer); }, [onFinish]);
    return (
        <div className={`fixed inset-0 z-[99999] bg-white flex items-center justify-center transition-opacity duration-1000 ${isFinishing ? 'pointer-events-none' : ''}`}>
             <h1 className={`flex items-baseline gap-1 tracking-tighter ${isFinishing ? 'animate-disperse' : ''}`}>
                <span className="text-4xl md:text-6xl font-bold font-outfit text-stone-900">STILLS</span>
                <span className="text-4xl md:text-6xl font-light font-outfit text-stone-900">by</span>
                <span className="text-4xl md:text-6xl font-bold font-outfit text-stone-900">HEUM</span>
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
        <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none" />
    </section>
  );
};

const PortfolioStrip: React.FC<{ album: PortfolioAlbum, duration: number }> = ({ album, duration }) => {
    const { setSelectedAlbum } = useAppContext();
    const displayImages = [...album.images, ...album.images].slice(0, 15); 
    return (
        <div className="relative w-full py-4 overflow-hidden bg-white border-b border-stone-100">
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto cursor-pointer" onClick={() => setSelectedAlbum(album)}>
                    <h3 className="text-5xl md:text-8xl font-outfit font-black text-white relative z-50 tracking-tighter uppercase drop-shadow-sm">
                         {album.title.en}
                    </h3>
                </div>
            </div>
            <div className="flex gap-4 animate-marquee w-max px-4 items-center" style={{ animationDuration: `${duration}s` }}>
                {displayImages.map((img, idx) => (
                    <div key={`${album.id}-${idx}`} onClick={() => setSelectedAlbum(album)} className="relative shrink-0 rounded-lg overflow-hidden cursor-pointer w-[85vw] h-auto aspect-[3/4] md:w-auto md:h-[60vh] md:aspect-[3/4]">
                        <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const Navigation: React.FC = () => {
    const location = useLocation();
    const { content, language, setLanguage } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[8000] flex items-center justify-center w-full max-w-4xl px-4 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/20">
                    <Link to="/" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>STILLS</Link>
                    <Link to="/info" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/info' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>PRODUCT</Link>
                    <Link to="/reviews" className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${location.pathname === '/reviews' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}>REVIEW</Link>
                </div>
            </nav>

            {/* Sticky Floating Sidebar Toggle - Stays visible on scroll */}
            <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[8001]">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="flex flex-col items-center justify-center w-12 h-12 bg-black text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
                >
                    {isMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
                </button>
                
                {isMenuOpen && (
                    <div className="absolute top-0 right-14 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200 p-3 flex flex-col gap-2 min-w-[180px] animate-spring-up origin-right">
                        <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-stone-100 transition-all text-sm font-black text-stone-800">
                            <CalendarIcon size={18} className="text-black" />
                            <span>BOOKING</span>
                        </Link>
                        <div className="h-px bg-stone-100 mx-2 my-1" />
                        <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-stone-100 transition-all text-sm font-medium text-stone-700">
                            <Instagram size={18} className="text-pink-500" />
                            <span>Instagram</span>
                        </a>
                        <a href={content.kakaoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl hover:bg-stone-100 transition-all text-sm font-medium text-stone-700">
                            <MessageCircle size={18} className="text-yellow-500 fill-yellow-500" />
                            <span>KakaoTalk</span>
                        </a>
                        <button onClick={() => { setLanguage(language === 'ko' ? 'en' : 'ko'); setIsMenuOpen(false); }} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-stone-100 transition-all text-sm font-medium text-stone-700 text-left w-full">
                            <Globe size={18} className="text-blue-500" />
                            <span>Language</span>
                        </button>
                    </div>
                )}
            </div>
            {isMenuOpen && <div className="fixed inset-0 z-[8000] bg-black/5 backdrop-blur-[2px]" onClick={() => setIsMenuOpen(false)} />}
        </>
    );
};

const ReviewPage: React.FC = () => {
    const { reviews } = useAppContext();
    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold font-outfit mb-12 text-center tracking-tight">REVIEWS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.map(r => (
                    <div key={r.id} className="p-8 bg-stone-50 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="font-bold text-lg">{r.author}</span>
                                <div className="flex text-yellow-400 mt-1">
                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                            </div>
                            <span className="text-xs text-stone-400">{r.date}</span>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed mb-6 font-light">{r.content}</p>
                        {r.photos && r.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                {r.photos.map((p, i) => <img key={i} src={p} className="w-24 h-24 object-cover rounded-2xl shrink-0" alt="Review" />)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const InfoPage: React.FC = () => {
    const { content, language } = useAppContext();
    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-4xl mx-auto space-y-24">
             <section className="text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-300 mb-4">Artist</h2>
                <p className="text-xl md:text-3xl leading-relaxed font-light text-stone-800 whitespace-pre-line">{content.artistGreeting[language]}</p>
             </section>
             <section>
                <h2 className="text-3xl font-bold font-outfit mb-10 text-center uppercase tracking-tight">Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.packages.map(pkg => (
                        <div key={pkg.id} className={`p-10 rounded-[3rem] border relative overflow-hidden group ${pkg.color} min-h-[350px] shadow-sm`}>
                            <h3 className="text-2xl font-black mb-2 uppercase">{pkg.title[language]}</h3>
                            <p className="text-lg opacity-60 mb-8 font-mono">{pkg.price}</p>
                            <ul className="space-y-3 text-sm opacity-90">
                                {pkg.features[language].map((f, i) => ( <li key={i} className="flex gap-3"><Check size={16} className="mt-0.5 shrink-0"/> <span className="font-medium">{f}</span></li> ))}
                            </ul>
                        </div>
                    ))}
                </div>
             </section>
             <section>
                 <h2 className="text-3xl font-bold font-outfit mb-10 text-center uppercase tracking-tight">Notice</h2>
                 <div className="space-y-12">
                     {content.notices.map(n => (
                         <div key={n.id} className="border-l-[3px] border-stone-100 pl-8">
                             <h4 className="font-bold text-xl mb-3 text-stone-900">{n.title[language]}</h4>
                             <p className="text-stone-500 text-sm leading-relaxed whitespace-pre-line font-light">{n.description[language]}</p>
                         </div>
                     ))}
                 </div>
             </section>
        </div>
    );
};

const ContactPage: React.FC = () => {
    return (
        <div className="min-h-screen pt-32 px-6 pb-32 max-w-4xl mx-auto">
             <h2 className="text-4xl font-bold font-outfit mb-12 text-center tracking-tight">BOOKING</h2>
             <div className="bg-white p-10 md:p-20 rounded-[3rem] shadow-2xl border border-stone-50">
                <div className="p-12 text-center bg-stone-50 rounded-[2rem]">
                    <CalendarIcon size={64} className="mx-auto mb-6 text-stone-200" />
                    <p className="text-stone-600 font-medium">Please select your preferred date to continue.</p>
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
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl px-8 py-6 flex justify-between items-center border-b border-stone-50">
                <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><CloseIcon size={28} /></button>
                <h2 className="font-outfit text-xl font-black uppercase tracking-widest">{selectedAlbum.title.en}</h2>
                <div className="w-10"></div>
            </div>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 px-6 py-10 max-w-screen-2xl mx-auto space-y-6">
                {selectedAlbum.images.map((img, idx) => (
                    <img key={idx} src={img} className="w-full rounded-3xl hover:opacity-95 transition-all shadow-md cursor-zoom-in" alt={`Portfolio ${idx}`} />
                ))}
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [splash, setSplash] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [contentReady, setContentReady] = useState(false);
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
        }, 1000);
    };

    return (
        <div className="font-sans text-stone-900 bg-white min-h-screen relative selection:bg-stone-200">
            {splash && <SplashScreen onFinish={handleFinish} isFinishing={finishing} />}
            
            <div className={`transition-all duration-1000 ${contentReady ? 'opacity-100 animate-fade-in-slow' : 'opacity-0'}`}>
                <ScrollToTop />
                <Navigation />
                <div key={location.pathname} className={direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
                    <Routes location={location}>
                        <Route path="/" element={
                            <div className="min-h-screen bg-white pb-32">
                                <HeroSection />
                                <div className="flex flex-col gap-0 -mt-20 relative z-10 bg-white rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)] pt-20">
                                    {INITIAL_CONTENT.portfolio.map((p, i) => (
                                        <PortfolioStrip key={p.id} album={p} duration={[70,45,55,35][i]} />
                                    ))}
                                </div>
                            </div>
                        } />
                        <Route path="/info" element={<InfoPage />} />
                        <Route path="/reviews" element={<ReviewPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                    </Routes>
                </div>
                <footer className="py-20 text-center border-t border-stone-50 mt-20">
                    <h4 className="font-outfit text-2xl font-black tracking-tighter uppercase">STILLS <span className="font-light">by</span> HEUM</h4>
                </footer>
            </div>
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