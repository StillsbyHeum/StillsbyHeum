import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { Language, ContentData, Review, PortfolioAlbum, AILog } from '../types';
import { INITIAL_CONTENT, INITIAL_REVIEWS } from '../constants';

// Removed duplicate AppContextType and AppContext creation
// The new definition is at the top of the file

import { auth, loginWithGoogle, logoutAdmin, checkAdminAuth, getMockUser } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

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
  addReview: (review: Review) => void;
  updateReviews: (reviews: Review[]) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  saveToLocalStorage: () => void;
  likedPhotos: string[];
  toggleLike: (url: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  // Admin & Inline Edit
  isAdmin: boolean;
  login: () => Promise<boolean>;
  loginAsDev: () => void; // New Method
  logout: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  user: User | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [content, setContent] = useState<ContentData>(INITIAL_CONTENT);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Admin State
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser && checkAdminAuth(currentUser)) {
              setUser(currentUser);
              setIsAdmin(true);
          } else if (!user?.uid?.startsWith('dev-')) { // Don't clear if using dev mock
              setUser(null);
              setIsAdmin(false);
              setIsEditMode(false);
          }
      });
      return () => unsubscribe();
  }, [user]); // Added dependency to check current user state

  const login = async () => {
      return await loginWithGoogle();
  };

  const loginAsDev = () => {
      const mock = getMockUser();
      setUser(mock);
      setIsAdmin(true);
  };

  const logout = () => {
      logoutAdmin();
      setUser(null);
      setIsAdmin(false);
      setIsEditMode(false);
  };

  const toggleEditMode = () => {
      if (isAdmin) setIsEditMode(prev => !prev);
  };

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
          const target = prev[key];
          
          // Handle Array Update
          if (Array.isArray(target) && subKey !== '') {
              const index = parseInt(subKey);
              if (!isNaN(index) && index >= 0 && index < target.length) {
                  const newArray = [...target];
                  newArray[index] = value;
                  return { ...prev, [key]: newArray };
              }
          }

          // Handle Object Update (Nested)
          if (subKey && typeof target === 'object' && target !== null && !Array.isArray(target)) {
              return { ...prev, [key]: { ...target, [subKey]: value } };
          }

          // Handle Direct Update
          return { ...prev, [key]: value };
      });
  };

  // Helper to update reviews from Admin
  const updateReviews = (newReviews: Review[]) => {
      setReviews(newReviews);
  };

  const updateReview = (id: string, updates: Partial<Review>) => {
      setReviews(prev => {
          const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
          localStorage.setItem('heum_reviews', JSON.stringify(updated));
          return updated;
      });
  };

  const deleteReview = (id: string) => {
      setReviews(prev => {
          const updated = prev.filter(r => r.id !== id);
          localStorage.setItem('heum_reviews', JSON.stringify(updated));
          return updated;
      });
  };

  const addReview = (review: Review) => {
      setReviews(prev => {
          const updated = [review, ...prev];
          localStorage.setItem('heum_reviews', JSON.stringify(updated));
          return updated;
      });
  };

  const [likedPhotos, setLikedPhotos] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
      const savedLikes = localStorage.getItem('likedPhotos');
      if (savedLikes) setLikedPhotos(JSON.parse(savedLikes));
      
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
          setTheme(savedTheme);
          if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
          document.documentElement.classList.add('dark');
      }
  }, []);

  const toggleLike = (url: string) => {
      setLikedPhotos(prev => {
          const newLikes = prev.includes(url) ? prev.filter(p => p !== url) : [...prev, url];
          localStorage.setItem('likedPhotos', JSON.stringify(newLikes));
          return newLikes;
      });
  };

  const toggleTheme = () => {
      setTheme(prev => {
          const newTheme = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme', newTheme);
          if (newTheme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          return newTheme;
      });
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
      updateReviews,
      updateReview,
      deleteReview,
      addReview,
      likedPhotos,
      toggleLike,
      theme,
      toggleTheme,
      isAdmin,
      login,
      loginAsDev,
      logout,
      isEditMode,
      toggleEditMode,
      user
    }}>
      {children}
    </AppContext.Provider>
  );
};
