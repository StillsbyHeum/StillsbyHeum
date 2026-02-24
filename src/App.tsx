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
        <div className="font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-black bg-white dark:bg-[#050505] dark:text-white min-h-screen relative selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500">
            {splash && <SplashScreen onFinish={handleFinish} isFinishing={finishing} />}
            
            {contentReady && (
                <header className="fixed top-0 left-0 w-full p-6 flex items-start justify-between z-50 mix-blend-difference text-white pointer-events-none">
                    <div className="flex flex-col gap-1 pointer-events-auto">
                        <LondonTime />
                        <ThemeToggle />
                    </div>
                    <div className="pointer-events-auto">
                        <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                    </div>
                </header>
            )}

            <div className={`transition-all duration-[2000ms] ${contentReady ? 'opacity-100 animate-fade-in-slow' : 'opacity-0'}`}>
                <ScrollToTop />
                <EditModeControls />
                
                <div className="relative z-10 bg-white dark:bg-[#050505] min-h-screen transition-colors duration-500">
                    <div key={location.pathname} className={direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes location={location}>
                                <Route path="/" element={
                                    <div className="min-h-screen bg-white dark:bg-[#050505]">
                                        <FlipClockPortfolio />
                                        <div className="flex flex-col gap-0 relative z-10 bg-white dark:bg-[#050505]">
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
                                    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
                                        <h1 className="text-huge">404</h1>
                                    </div>
                                } />
                            </Routes>
                        </Suspense>
                    </div>
                </div>
                
                <footer className="relative z-0 py-20 px-6 bg-white dark:bg-[#050505] border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row justify-between items-end gap-10">
                    <div>
                        <h1 className="text-editorial-h2 mb-2">
                            STILLS BY HEUM
                        </h1>
                        <p className="text-editorial-micro text-black/50 dark:text-white/50">© {new Date().getFullYear()} ALL RIGHTS RESERVED.</p>
                    </div>
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
