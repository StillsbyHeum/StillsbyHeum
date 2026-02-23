import './styles/theme.css';
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Navigation from './components/Navigation';
import FloatingDock from './components/FloatingDock';
import FAQWidget from './components/FAQWidget';
import AlbumDetail from './components/AlbumDetail';
import FlipClockPortfolio from './components/FlipClockPortfolio';
import ArtistSection from './components/ArtistSection';
import SplashScreen from './components/SplashScreen';
import ScrollToTop from './components/ScrollToTop';
import LondonTime from './components/LondonTime';
import ThemeToggle from './components/ThemeToggle';
import LoadingSpinner from './components/LoadingSpinner';
import EditModeControls from './components/admin/EditModeControls';
import TempAdminButton from './components/TempAdminButton';

// Lazy load pages for performance optimization
const InfoPage = lazy(() => import('./pages/InfoPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

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
        if (path === '/faq') return 4;
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
        <div className="font-['Asta_Sans',sans-serif] text-stone-900 bg-white dark:bg-stone-950 dark:text-stone-50 min-h-screen relative selection:bg-black selection:text-white transition-colors duration-500">
            {splash && <SplashScreen onFinish={handleFinish} isFinishing={finishing} />}
            
            {contentReady && (
                <header className="w-full bg-white dark:bg-stone-950 pt-6 px-6 flex flex-col md:flex-row items-center justify-between gap-4 z-50 relative">
                    <div className="flex items-center gap-4 self-start md:self-center">
                        <LondonTime />
                        <ThemeToggle />
                    </div>
                    <div className="w-full md:w-auto flex justify-center">
                        <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                    </div>
                    <div className="hidden md:block w-[120px]" /> {/* Spacer for visual balance */}
                </header>
            )}

            <div className={`transition-all duration-[2000ms] ${contentReady ? 'opacity-100 animate-fade-in-slow' : 'opacity-0'}`}>
                <ScrollToTop />
                <EditModeControls />
                <TempAdminButton />
                
                <div className="relative z-10 bg-white dark:bg-stone-950 rounded-b-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-h-screen pb-20 transition-colors duration-500">
                    <div key={location.pathname} className={direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes location={location}>
                                <Route path="/" element={
                                    <div className="min-h-screen bg-white dark:bg-stone-950 pb-60 pt-10">
                                        <FlipClockPortfolio />
                                        <div className="flex flex-col gap-0 relative z-10 bg-white dark:bg-stone-950">
                                            <ArtistSection />
                                        </div>
                                    </div>
                                } />
                                <Route path="/info" element={<InfoPage />} />
                                <Route path="/reviews" element={<ReviewPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/faq" element={<FAQPage />} />
                                <Route path="/heum-admin-secure" element={<AdminPage />} />
                                <Route path="*" element={
                                    <div className="min-h-screen flex items-center justify-center bg-stone-50">
                                        <h1 className="text-4xl font-bold text-stone-300">404</h1>
                                    </div>
                                } />
                            </Routes>
                        </Suspense>
                    </div>
                </div>
                
                <footer className="relative z-0 py-40 text-center -mt-40 pt-60 pb-60 bg-black text-white">
                    <h1 className="flex items-baseline justify-center gap-1 tracking-tighter mb-12">
                        <span className="text-4xl md:text-6xl font-extrabold font-outfit text-white">STILLS</span>
                        <span className="text-4xl md:text-6xl font-light font-outfit text-white">by</span>
                        <span className="text-4xl md:text-6xl font-extrabold font-outfit text-white">HEUM</span>
                    </h1>
                    <FloatingDock onOpenFAQ={() => setFaqOpen(true)} onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
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
