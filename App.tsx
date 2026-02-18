import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, Lock, Camera, Calendar as CalendarIcon, MessageCircle, Clock, Ban, Zap, ChevronRight, ChevronLeft, Instagram, X as CloseIcon, HelpCircle, ChevronDown, ChevronUp, Star, Trash2, Plus, PenTool, Image as ImageIcon, Music, VolumeX, Volume2, ArrowRight, MapPin, CreditCard, Umbrella, FileText, CheckCircle, LogOut, Settings, Play, Pause, ZoomIn, Mail, Heart } from 'lucide-react';
import { Language, DaySchedule, TimeSlot, ContentData, AdminUser, NoticeItem, Review, PortfolioAlbum, FAQItem, MeetingPoint } from './types';
import { INITIAL_CONTENT, PACKAGES, NOTICES, DEFAULT_SLOTS, ADMIN_EMAIL, INITIAL_REVIEWS } from './constants';
import { generateResponse } from './services/geminiService';

// --- Context Setup ---

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: ContentData;
  updateContent: (key: keyof ContentData, subKey: string, value: any) => void;
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
  addPortfolioAlbum: (album: PortfolioAlbum) => void;
  addPortfolioImage: (albumId: string, imageUrl: string) => void;
  addFAQ: (faq: FAQItem) => void;
  updateFAQ: (faq: FAQItem) => void;
  deleteFAQ: (id: string) => void;
  isPlaying: boolean;
  toggleAudio: () => void;
  requestBooking: (date: string, slotId: string) => void;
  // State for Gallery Visibility to control Navbar
  selectedAlbum: PortfolioAlbum | null;
  setSelectedAlbum: (album: PortfolioAlbum | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Styles ---
// Stylish Forest Green
const FOREST_GREEN = "bg-[#1a4c35]"; 
const FOREST_GREEN_TEXT = "text-[#1a4c35]";
const FOREST_GREEN_BORDER = "border-[#1a4c35]";

// --- Helper Components ---

const IconRenderer: React.FC<{ iconName: string; className?: string }> = ({ iconName, className }) => {
  const icons: any = { Clock, Ban, Zap, MapPin, CreditCard, Umbrella, FileText, Camera };
  const Icon = icons[iconName] || MessageCircle;
  return <Icon className={className} />;
};

// Grain Overlay Component (Logic mostly handled in CSS)
const GrainOverlay = () => (
    <div className="fixed inset-0 pointer-events-none z-[9998]" /> 
    /* CSS .bg-grain::before handles the actual grain overlay to allow scrolling */
);

// Updated Splash Screen with iPhone UI feel (Smooth Fade/Reveal)
const SplashScreen: React.FC<{ onFinish: () => void; isFinishing: boolean }> = ({ onFinish, isFinishing }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
           onFinish();
        }, 2200); // Wait for logo to sit, then trigger finish state
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div 
            className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isFinishing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
             <div className="text-white text-center">
                <h1 className="font-outfit text-4xl md:text-6xl font-bold tracking-tighter animate-pulse">
                    STILLS<span className="font-normal font-sans mx-2 text-2xl md:text-4xl align-middle text-stone-300">by</span>HEUM
                </h1>
            </div>
        </div>
    );
};

// --- Review Card with Carousel ---
// Updated to pass index for lightbox
const ReviewCard: React.FC<{ review: Review, onImageClick: (photos: string[], index: number) => void }> = ({ review, onImageClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (review.photos && review.photos.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % review.photos.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (review.photos && review.photos.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + review.photos.length) % review.photos.length);
        }
    };

    return (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100 h-full flex flex-col w-[300px] md:w-[400px] shrink-0 mx-4 whitespace-normal">
            
            {/* Header: Stars & Name/Date moved here */}
            <div className="flex justify-between items-start mb-6 border-b border-stone-50 pb-4">
                <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}
                </div>
                <div className="text-right">
                    <h4 className="font-bold text-sm text-stone-900 leading-none mb-1">{review.author}</h4>
                    <span className="text-[10px] text-stone-400 font-medium">{review.date}</span>
                </div>
            </div>
            
            {review.photos && review.photos.length > 0 && (
                <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden group bg-stone-100">
                     <img 
                        src={review.photos[currentImageIndex]} 
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-105" 
                        alt="" 
                        onClick={() => onImageClick(review.photos, currentImageIndex)}
                     />
                     {review.photos.length > 1 && (
                         <>
                             <button 
                                onClick={prevImage} 
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                                 <ChevronLeft size={16} />
                             </button>
                             <button 
                                onClick={nextImage} 
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                                 <ChevronRight size={16} />
                             </button>
                             <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                 {currentImageIndex + 1} / {review.photos.length}
                             </div>
                         </>
                     )}
                </div>
            )}

            <p className="text-stone-700 text-sm leading-relaxed mb-2 min-h-[60px] flex-1 line-clamp-4">"{review.content}"</p>
        </div>
    );
}

// --- Calendar Component (Updated with Form) ---

const CalendarView: React.FC<{ 
  isAdmin?: boolean;
}> = ({ isAdmin = false }) => {
  const { schedule, toggleSlot, language, requestBooking } = useAppContext();
  
  // State for Year/Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [bookingForm, setBookingForm] = useState<{
      slotId: string, 
      name: string, 
      count: string,
      relationship: string,
      props: string,
      comments: string
  } | null>(null);
  
  // Ref for slots container
  const slotsContainerRef = useRef<HTMLDivElement>(null);
  
  // State for Login Selection
  const [showLoginSelection, setShowLoginSelection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination for days strip (7 days per view)
  const [startIndex, setStartIndex] = useState(0);
  
  // Animation direction state
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'fade'>('fade');
  const visibleDays = 7;

  // Initialize selectedDate to TOMORROW (24h later)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Start from tomorrow
    
    // Update both current view date and selected date
    setCurrentDate(tomorrow);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    
    // Calculate start index so 'tomorrow' is visible
    const dayOfMonth = tomorrow.getDate();
    const newStartIndex = Math.floor((dayOfMonth - 1) / visibleDays) * visibleDays;
    setStartIndex(newStartIndex);
  }, []);
  
  // Auto-scroll logic for slots (Consider Current Time)
  useEffect(() => {
      if (slotsContainerRef.current) {
          const now = new Date();
          const currentHour = now.getHours();
          // If selectedDate is today (rare case now with tomorrow default), check time
          const isToday = selectedDate === now.toISOString().split('T')[0];
          
          if (isToday) {
             const slotNodes = slotsContainerRef.current.children;
             for (let i = 0; i < slotNodes.length; i++) {
                const btn = slotNodes[i] as HTMLElement;
                const timeText = btn.textContent || "";
                const slotH = parseInt(timeText.split(':')[0], 10);
                if (slotH > currentHour) {
                    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                    break;
                }
             }
          }
      }
  }, [selectedDate, bookingForm]);

  // Generate days for the current month view
  const daysInMonth = React.useMemo(() => {
    const d = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    
    while (date.getMonth() === month) {
      d.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }
    return d;
  }, [currentDate]);

  // Handle month change
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setStartIndex(0); // Reset start index on month change
    setSlideDir('fade');
  };

  const currentSlots = schedule[selectedDate]?.slots || [];

  const handleSlotClick = (slotId: string, isBooked: boolean, isBlocked: boolean, isPast: boolean) => {
    if (isAdmin) {
      toggleSlot(selectedDate, slotId, 'block');
    } else {
      if (isBlocked || isPast) return;
      
      // Check 24 hour restriction
      const now = new Date();
      const targetDate = new Date(`${selectedDate}T${slotId}`);
      
      const diffMs = targetDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) { // Strictly enforcing 24h notice
          alert(language === 'ko' 
            ? "현재 시간 기준 24시간 이내의 예약은 별도로 연락 부탁드립니다." 
            : "For bookings within 24 hours, please contact us directly.");
          return;
      }

      setBookingForm({ slotId, name: '', count: '', relationship: '', props: '', comments: '' });
      setShowLoginSelection(false);
    }
  };

  const handleBookingStageOne = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm || !bookingForm.name || !bookingForm.count || !bookingForm.relationship) {
        alert(language === 'ko' ? "필수 정보를 입력해주세요." : "Please fill in required fields.");
        return;
    }
    // Proceed to login selection
    setShowLoginSelection(true);
  };

  const finalizeBooking = async () => {
    if (!bookingForm) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    requestBooking(selectedDate, bookingForm.slotId);

    const msg = language === 'ko' 
        ? "Google 계정으로 메시지가 전송되었습니다! 📸\n\n당신의 가장 빛나는 순간을 위해, 제가 잠시 고민 후 확정 메일을 슝 보내드릴게요.\n(메일함을 꼭 확인해주세요!)"
        : "Message sent via Google Account! 📸\n\nI'll confirm your shining moment and send you an email shortly.\n(Please check your inbox!)";
    
    alert(msg);
    setIsProcessing(false);
    setBookingForm(null);
    setShowLoginSelection(false);
  };

  const shiftDays = (dir: number) => {
    const newIndex = startIndex + dir * visibleDays;
    if (newIndex >= 0 && newIndex < daysInMonth.length) {
      setSlideDir(dir > 0 ? 'right' : 'left');
      setStartIndex(newIndex);
    }
  };

  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long' });
  const todayStr = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  
  const gridAnimClass = slideDir === 'right' ? 'animate-slide-in-right' : slideDir === 'left' ? 'animate-slide-in-left' : 'animate-fade-in';

  return (
    <div className="w-full">
      {/* Year/Month Selector */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-stone-900 capitalize">{monthName} {year}</span>
            <div className="flex gap-1 ml-2">
                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-black/5 rounded-full transition text-stone-600">
                    <ChevronLeft size={16} />
                </button>
                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-black/5 rounded-full transition text-stone-600">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>
      
      {/* Date Strip */}
      <div className="h-[90px] overflow-hidden relative">
          <div className={`grid grid-cols-7 gap-1 mb-6 absolute w-full ${gridAnimClass}`} key={startIndex}>
              {daysInMonth.slice(startIndex, startIndex + visibleDays).map(date => {
                const d = new Date(date);
                const dayName = d.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'short' });
                const dayNum = d.getDate();
                const isSelected = selectedDate === date;
                const isPastDate = date < todayStr;
                
                return (
                  <button 
                    key={date}
                    onClick={() => {
                        setSelectedDate(date);
                        setBookingForm(null);
                        setShowLoginSelection(false);
                    }}
                    disabled={isPastDate && !isAdmin}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                      isSelected ? 'bg-black text-white shadow-lg scale-105 z-10' : 
                      isPastDate && !isAdmin ? 'text-stone-300 cursor-not-allowed blur-[1px]' : 'bg-transparent text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'opacity-100' : 'opacity-60'}`}>{dayName}</span>
                    <span className="text-lg font-medium leading-none mt-1">{dayNum}</span>
                  </button>
                )
              })}
              {/* Fillers if less than 7 days */}
              {daysInMonth.slice(startIndex, startIndex + visibleDays).length < 7 && 
                [...Array(7 - daysInMonth.slice(startIndex, startIndex + visibleDays).length)].map((_, i) => (
                    <div key={`empty-${i}`} className="w-full h-full"></div>
                ))
              }
          </div>
      </div>
      
      {/* Navigation for Days */}
      <div className="flex justify-between mb-4 px-2 mt-2">
         <button 
            onClick={() => shiftDays(-1)} 
            disabled={startIndex === 0}
            className="text-xs font-bold text-stone-400 hover:text-black disabled:opacity-20 flex items-center gap-1 transition"
        >
             <ChevronLeft size={12} /> {language === 'ko' ? '지난 주' : 'Prev'}
         </button>
         <button 
            onClick={() => shiftDays(1)} 
            disabled={startIndex + visibleDays >= daysInMonth.length}
            className="text-xs font-bold text-stone-400 hover:text-black disabled:opacity-20 flex items-center gap-1 transition"
        >
             {language === 'ko' ? '다음 주' : 'Next'} <ChevronRight size={12} />
         </button>
      </div>

      <div className="h-px bg-stone-300 w-full mb-6"></div>

      {/* Slots Grid */}
      <div 
        ref={slotsContainerRef}
        className="grid grid-cols-4 gap-3 max-h-[240px] overflow-y-auto pr-1 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        {DEFAULT_SLOTS.map((time) => {
          const slot = currentSlots.find(s => s.time === time);
          const isBooked = slot?.isBooked || false;
          const isBlocked = slot?.isBlocked || false;
          const isSelected = bookingForm?.slotId === time;
          const count = slot?.count || 0;
          
          const slotHour = parseInt(time.split(':')[0], 10);
          // Check if slot is in the past relative to REAL time
          const now = new Date();
          const targetDateTime = new Date(`${selectedDate}T${time}`);
          const isPastTime = targetDateTime < now;
          
          let btnClass = "bg-white/80 border border-stone-200 text-stone-800 hover:border-stone-400 hover:shadow-md";
          
          if (isAdmin) {
             if (isBlocked) btnClass = "bg-red-50 text-red-500 border-red-200 hover:bg-red-100";
             else btnClass = "border-2 border-blue-200 hover:bg-blue-50 text-blue-900";
          } else {
             if (isBlocked || isPastTime) {
                 btnClass = "bg-stone-100/50 text-stone-300 cursor-not-allowed border-transparent blur-[1px] opacity-60";
             }
             else if (isSelected) {
                 btnClass = `${FOREST_GREEN} text-white ${FOREST_GREEN_BORDER} shadow-lg scale-105`;
             }
          }

          return (
            <button
              key={time}
              disabled={!isAdmin && (isBlocked || isPastTime)}
              onClick={() => handleSlotClick(time, isBooked, isBlocked, isPastTime)}
              className={`relative py-3 rounded-xl text-sm font-medium transition duration-200 flex items-center justify-center gap-1 ${btnClass}`}
            >
              {time}
              {isAdmin && isBlocked && <Lock size={12} />}
              {/* Count Indicator */}
              {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                      {count}
                  </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Booking Form Overlay */}
      {bookingForm && !isAdmin && (
          <div className="mt-6 p-4 bg-white rounded-2xl animate-pop-in border border-stone-200 shadow-xl relative overflow-hidden">
              {showLoginSelection ? (
                 <div className="animate-fade-in text-center p-4">
                     <h4 className="text-lg font-bold mb-2">Sign in with Google</h4>
                     <p className="text-xs text-stone-500 mb-6">예약 확정을 위해 Google 로그인이 필요합니다.</p>
                     
                     <div className="space-y-3">
                         <button 
                            onClick={finalizeBooking}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 p-3 rounded-lg shadow-sm hover:bg-stone-50 transition"
                        >
                             {isProcessing ? (
                                 <span className="text-stone-500 text-sm">Processing...</span>
                             ) : (
                                 <>
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <span className="font-bold text-blue-500">G</span>
                                    </div>
                                    <span className="text-sm font-medium text-stone-700">Google 계정으로 예약 전송</span>
                                 </>
                             )}
                         </button>
                     </div>
                     <button 
                        onClick={() => setShowLoginSelection(false)} 
                        className="mt-6 text-xs text-stone-400 underline"
                     >
                         뒤로 가기 (Back)
                     </button>
                 </div>
              ) : (
                <>
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <div className={`w-2 h-2 ${FOREST_GREEN} rounded-full animate-pulse`}></div>
                        {language === 'ko' ? `${bookingForm.slotId} 예약 정보 입력` : `Book ${bookingForm.slotId}`}
                    </h4>
                    <form onSubmit={handleBookingStageOne} className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="성함 (*촬영인원 모두 적어주세요)"
                            className="w-full p-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-black transition placeholder:text-xs bg-white"
                            value={bookingForm.name}
                            onChange={e => setBookingForm({...bookingForm, name: e.target.value})}
                            required
                        />
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="인원수"
                                className="w-1/3 p-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-black transition placeholder:text-xs bg-white"
                                value={bookingForm.count}
                                onChange={e => setBookingForm({...bookingForm, count: e.target.value})}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="상호관계 (*필수)"
                                className="w-2/3 p-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-black transition placeholder:text-xs bg-white"
                                value={bookingForm.relationship}
                                onChange={e => setBookingForm({...bookingForm, relationship: e.target.value})}
                                required
                            />
                        </div>
                        <input 
                            type="text" 
                            placeholder="소품 (*챙겨오시는 경우 적어주세요)"
                            className="w-full p-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-black transition placeholder:text-xs bg-white"
                            value={bookingForm.props}
                            onChange={e => setBookingForm({...bookingForm, props: e.target.value})}
                        />
                        <textarea
                            rows={3}
                            placeholder="하고 싶은 말 / 문의사항 (Questions / Comments)"
                            className="w-full p-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-black transition placeholder:text-xs bg-white resize-y min-h-[80px]"
                            value={bookingForm.comments}
                            onChange={(e) => {
                                setBookingForm({...bookingForm, comments: e.target.value});
                                // Auto expand
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                        
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setBookingForm(null)} className="flex-1 bg-white border border-stone-300 text-stone-600 py-3 rounded-lg text-xs font-bold uppercase hover:bg-stone-50 transition">
                                {language === 'ko' ? "취소" : "Cancel"}
                            </button>
                            {/* Apply Button: Stylish Forest Green */}
                            <button type="submit" className={`flex-1 ${FOREST_GREEN} text-white py-3 rounded-lg text-xs font-bold uppercase hover:opacity-90 transition`}>
                                {language === 'ko' ? "예약 신청" : "Apply"}
                            </button>
                        </div>
                    </form>
                </>
              )}
          </div>
      )}
      
      {!isAdmin && !bookingForm && <div className="mt-6 pt-4 flex gap-6 text-[10px] justify-center uppercase tracking-[0.2em] font-bold">
        <div className="flex items-center gap-2 text-black"><div className="w-2 h-2 bg-black rounded-full"></div> {language === 'ko' ? '가능' : 'Available'}</div>
        <div className="flex items-center gap-2 text-orange-500"><div className="w-2 h-2 bg-orange-500 rounded-full"></div> {language === 'ko' ? '대기중' : 'Standby'}</div>
        <div className="flex items-center gap-2 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full"></div> {language === 'ko' ? '마감' : 'Full'}</div>
      </div>}
    </div>
  );
};

// --- FAQ Widget ---

const FAQWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { language, content } = useAppContext();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  }

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 right-0 glass-panel w-[90vw] md:w-80 max-h-[500px] rounded-[32px] shadow-2xl flex flex-col mb-4 overflow-hidden animate-pop-in border border-white/60 z-[110]">
      <div className="bg-stone-900/95 backdrop-blur text-white p-6 flex justify-between items-center">
        <span className="font-bold text-sm tracking-widest uppercase">FAQ</span>
        <button onClick={onClose}><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white/40">
        {content.faqs.map((item, idx) => (
            <div key={item.id} className="border border-stone-200 bg-white/70 rounded-2xl overflow-hidden">
                <button 
                    onClick={() => toggleFAQ(idx)}
                    className="w-full text-left p-4 flex justify-between items-center text-xs font-bold text-stone-800"
                >
                    {language === 'ko' ? item.q.ko : item.q.en}
                    {activeIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {activeIndex === idx && (
                    <div className="px-4 pb-4 text-xs font-medium text-stone-500 leading-relaxed border-t border-stone-100 pt-2">
                          {language === 'ko' ? item.a.ko : item.a.en}
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};

// --- Unified Bottom Bar (Booking, FAQ, Mute) ---

const BottomBar: React.FC = () => {
  const { language, isPlaying, toggleAudio } = useAppContext();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-0 w-full z-[9999] flex justify-center pointer-events-none">
        <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 shadow-2xl pointer-events-auto bg-white/80 backdrop-blur-md">
            
            {/* Audio Button */}
            <button 
                onClick={toggleAudio} 
                className="w-10 h-10 md:w-12 md:h-12 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition border border-stone-200"
            >
                 {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-1" />}
            </button>

            {/* FAQ Button */}
            <div className="relative">
                 <FAQWidget isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
                 <button 
                    onClick={() => setIsFAQOpen(!isFAQOpen)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition border border-stone-200 group"
                >
                    <span className="font-bold text-lg font-outfit group-hover:hidden">?</span>
                    <span className="font-bold text-lg font-outfit hidden group-hover:block">!</span>
                </button>
            </div>

            {/* Booking Button */}
            <div className="relative z-[110]">
                 {/* Desktop Backdrop - Click outside to Close */}
                 {isBookingOpen && (
                     <div 
                        className="fixed inset-0 z-[105] cursor-default bg-black/10 backdrop-blur-[1px]"
                        onClick={() => {
                            // On Desktop (md+), clicking outside closes. On Mobile, it does not.
                            if (window.matchMedia("(min-width: 768px)").matches) {
                                setIsBookingOpen(false);
                            }
                        }}
                     />
                 )}

                 {/* Mobile: Centered Fixed Modal, Desktop: Absolute Right */}
                 <div className={`
                    fixed bottom-24 left-1/2 -translate-x-1/2 w-[95vw] md:w-[400px]
                    md:absolute md:bottom-16 md:right-0 md:left-auto md:translate-x-0
                    transition-all duration-300 origin-bottom 
                    ${isBookingOpen ? 'scale-100 opacity-100 z-[110]' : 'scale-0 opacity-0 pointer-events-none'}
                 `}>
                     <div className="glass-panel max-h-[75vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] p-8 rounded-[40px] shadow-2xl backdrop-blur-2xl border border-white/60 bg-white/95">
                        <div className="flex justify-between items-center mb-6 px-1">
                            {/* Updated Header to match Button Style exactly */}
                            <span className="font-bold font-outfit tracking-tight text-xs md:text-sm uppercase whitespace-nowrap text-black">
                                BOOK <span className="font-normal lowercase">the</span> STILLS
                            </span>
                            <button onClick={() => setIsBookingOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 hover:text-black transition">
                                <CloseIcon size={16} />
                            </button>
                        </div>
                        <CalendarView />
                    </div>
                 </div>

                 <button 
                    onClick={() => setIsBookingOpen(!isBookingOpen)}
                    className={`h-10 md:h-12 rounded-full shadow-md transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center overflow-hidden relative z-[115] ${isBookingOpen ? 'bg-stone-900 text-white w-12 md:w-14 px-0 gap-0' : 'bg-black text-white w-48 md:w-56 px-6 gap-2'}`}
                >
                    <CalendarIcon size={16} className="shrink-0" />
                    <span className={`font-bold font-outfit tracking-tight text-xs md:text-sm uppercase whitespace-nowrap transition-all duration-300 ${isBookingOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        BOOK <span className="font-normal lowercase">the</span> STILLS
                    </span>
                    {/* Pulsing Dot: Updated to use new glow animation */}
                    {!isBookingOpen && <div className={`w-2 h-2 ${FOREST_GREEN} rounded-full animate-pulse-glow shrink-0 ml-1`}></div>}
                </button>
            </div>
        </div>
    </div>
  );
};


const Navbar: React.FC = () => {
  const { language, setLanguage, selectedAlbum, content } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Optimized Scroll Handler using requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
           setIsScrolled(window.scrollY > 50);
           ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
      if (isMobileMenuOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
      }
      return () => { document.body.style.overflow = ''; }
  }, [isMobileMenuOpen]);

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
      { id: 'portfolio', en: 'Portfolio', ko: '포트폴리오' },
      { id: 'packages', en: 'Packages', ko: '상품 안내' },
      { id: 'reviews', en: 'Reviews', ko: '후기' },
      { id: 'notice', en: 'Notice', ko: '안내사항' }
  ];

  // Hide Navbar when in Gallery (selectedAlbum is present) or specifically if desired
  if (selectedAlbum) return null;

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1) rounded-full border border-white/10 ${isScrolled ? 'w-[90%] md:w-[600px] bg-black/80 backdrop-blur-md shadow-2xl py-3 px-8' : 'w-full md:w-auto bg-transparent py-6 md:py-8 px-6 md:px-12'}`}>
      <div className={`flex justify-between items-center w-full ${isScrolled ? '' : 'max-w-7xl mx-auto'}`}>
        {/* Logo - Force White when Menu is Open */}
        <Link to="/" onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className={`font-outfit font-bold text-xl tracking-tighter z-50 flex items-center gap-1 transition-colors mr-12 ${isScrolled || isMobileMenuOpen ? 'text-white' : 'text-stone-900'}`}>
          STILLS<span className={`font-normal ${isScrolled || isMobileMenuOpen ? 'text-stone-400' : 'text-stone-600'}`}>by</span>HEUM
        </Link>

        {/* Desktop Menu - Wrapped for stability */}
        <div className={`hidden md:flex items-center gap-6 ${isScrolled ? 'text-white' : 'text-stone-900'}`}>
            <div className="flex gap-6">
              {navItems.map(item => (
                  <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-xs font-bold uppercase tracking-widest hover:text-stone-400 transition whitespace-nowrap">
                      {language === 'ko' ? item.ko : item.en}
                  </button>
              ))}
            </div>
            
            {/* Social Icons Restored */}
            <div className="flex items-center gap-3 border-l border-white/20 pl-4">
                <a href={content.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-stone-400 transition">
                    <Instagram size={16} />
                </a>
                <a href={content.kakaoUrl} target="_blank" rel="noreferrer" className="hover:text-stone-400 transition">
                    <MessageCircle size={16} />
                </a>
            </div>

            {/* Language Toggle - Fixed layout to prevent jumping */}
            <div className="w-12 flex justify-end">
                <button 
                    onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')} 
                    className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition hover:text-stone-400 whitespace-nowrap ${
                        isScrolled ? 'text-white' : 'text-stone-900'
                    }`}
                >
                    <Globe size={12} /> {language === 'ko' ? 'EN' : 'KR'}
                </button>
            </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className={`md:hidden z-[10001] p-2 relative transition-colors duration-300 ${isMobileMenuOpen || isScrolled ? 'text-white' : 'text-stone-900'}`}
        >
            {isMobileMenuOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Menu Overlay - Full Screen Grey Glass */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[10000] bg-zinc-900/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
                 {/* Close Button at top right */}
                 <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-8 right-8 text-white/70 hover:text-white transition p-2"
                 >
                     <X size={32} />
                 </button>
                 
                 {/* Content Centered */}
                 <div className="flex flex-col items-center space-y-10 animate-pop-in">
                     {navItems.map(item => (
                        <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-2xl font-bold uppercase tracking-tight text-white hover:text-stone-400 transition text-center">
                            {language === 'ko' ? item.ko : item.en}
                        </button>
                    ))}
                    
                    <div className="flex gap-8 mt-4 pt-8 border-t border-white/10 w-40 justify-center">
                        <a href={content.instagramUrl} target="_blank" rel="noreferrer" className="text-white hover:text-stone-400 transition">
                            <Instagram size={28} />
                        </a>
                        <a href={content.kakaoUrl} target="_blank" rel="noreferrer" className="text-white hover:text-stone-400 transition">
                            <MessageCircle size={28} />
                        </a>
                    </div>

                     <button 
                        onClick={() => { setLanguage(language === 'ko' ? 'en' : 'ko'); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80 hover:text-white transition mt-4"
                    >
                        <Globe size={16} /> {language === 'ko' ? 'English' : '한국어'}
                    </button>
                 </div>
            </div>
        )}
      </div>
    </nav>
  );
};


const HeroSection: React.FC = () => {
  return (
    <section id="about" className="relative w-full h-[90vh] overflow-hidden flex items-center justify-center">
      {/* Spline Animation */}
      <div className="absolute inset-0 z-0">
        <iframe 
          src='https://my.spline.design/distortingtypography-PrREx0Qo4PCMDVyAYxd6bmrd/' 
          frameBorder='0' 
          width='100%' 
          height='100%'
          className="w-full h-full pointer-events-none md:pointer-events-auto mix-blend-darken"
          title="Spline 3D Animation"
        ></iframe>
      </div>
      
      {/* Fade Overlay at bottom - Adjusted to match new bg color */}
      <div className="absolute bottom-0 left-0 w-full h-[250px] bg-gradient-to-t from-[#e6e6e6] via-[#e6e6e6] to-transparent z-20 pointer-events-none"></div>
    </section>
  );
};

// Replaced SignatureCollage with PortfolioHomeSection
const PortfolioHomeSection: React.FC = () => {
  const { language, content, selectedAlbum, setSelectedAlbum } = useAppContext();

  // Duplicating content for smooth infinite marquee
  const extendedPortfolio = [...content.portfolio, ...content.portfolio, ...content.portfolio, ...content.portfolio];

  return (
    <section id="portfolio" className="py-10 md:py-16 w-full overflow-hidden bg-transparent perspective-[1000px]">
        {/* New Artist Greeting Section - Thin and Small */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
            <div className="text-center">
                <p className="text-xs md:text-sm font-medium text-stone-500 uppercase tracking-widest leading-loose whitespace-pre-wrap break-words max-w-2xl mx-auto">
                    {language === 'ko' 
                        ? "안녕하세요, 흠입니다. 찰나의 순간을 영원으로 남겨드립니다." 
                        : "Hello, I am Heum. Capturing fleeting moments into eternity."}
                </p>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6">
                <div className="text-left">
                     {/* Removed Titles as requested */}
                </div>
            </div>

            {/* Albums Grid - Infinite CSS Marquee */}
            <div className="w-full overflow-hidden">
                <div className="flex gap-6 md:gap-8 animate-marquee w-max will-change-transform">
                    {extendedPortfolio.map((album, idx) => (
                    <div 
                        key={`${album.id}-${idx}`} 
                        onClick={() => setSelectedAlbum(album)}
                        className="min-w-[240px] w-[60vw] md:w-[350px] shrink-0 group relative rounded-[32px] overflow-hidden aspect-[2/3] md:aspect-[3/4] cursor-pointer transition duration-500 transform-gpu hover:scale-105"
                        style={{ transform: 'translate3d(0,0,0)' }}
                    >
                        <img 
                            src={album.cover} 
                            className="w-full h-full object-cover transition duration-700 grayscale group-hover:grayscale-0" 
                            alt={album.title.en} 
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-500"></div>
                        
                        {/* Overlay Text - Updated */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-500 translate-y-4 group-hover:translate-y-0">
                            <h3 className="text-2xl font-bold mb-2">{language === 'ko' ? album.title.ko : album.title.en}</h3>
                            <span className="text-[10px] uppercase tracking-widest border border-white/50 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                VIEW <span className="font-serif lowercase italic text-xs">more</span> STILLS
                            </span>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Fullscreen Gallery Modal */}
        {selectedAlbum && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-fade-in overflow-y-auto transition-opacity duration-500 ease-in-out">
              <div className="min-h-screen px-4 py-20 max-w-7xl mx-auto relative animate-slide-up">
                  <button 
                    onClick={() => setSelectedAlbum(null)}
                    className="fixed top-8 right-8 text-white/50 hover:text-white transition z-50 p-2 bg-white/10 rounded-full"
                  >
                      <X size={32} />
                  </button>
                  
                  <div className="text-center mb-16 text-white">
                      <h2 className="text-4xl font-bold mb-2">{language === 'ko' ? selectedAlbum.title.ko : selectedAlbum.title.en}</h2>
                      <p className="text-stone-400 text-sm tracking-widest uppercase">Gallery</p>
                  </div>

                  <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                      {selectedAlbum.images.map((img, idx) => (
                          <div key={idx} className="break-inside-avoid rounded-2xl overflow-hidden mb-6">
                              <img src={img} className="w-full h-auto" alt="" />
                          </div>
                      ))}
                  </div>
              </div>
          </div>
        )}
    </section>
  )
}

const PackagesSection: React.FC = () => {
  const { content, language } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPkg, setHoveredPkg] = useState<string | null>(null);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    setTimeout(() => setIsVisible(true), 10);
  };

  const closeDrawer = () => {
    setIsVisible(false);
    setTimeout(() => setIsDrawerOpen(false), 500);
  };

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isDrawerOpen]);

  return (
    <section id="packages" className="py-16 md:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-outfit text-4xl md:text-6xl text-stone-900 mb-8 tracking-tighter font-bold uppercase">
              PRICING <span className="font-light font-sans mx-1 text-black">&</span> PACKAGES
          </h2>
          <p className="text-stone-500 font-medium text-sm max-w-lg mx-auto">
             {language === 'ko' ? content.pricingSubtitle.ko : content.pricingSubtitle.en}
          </p>
        </div>

        {/* Desktop View: Grid with Blur Effect */}
        <div 
            className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 group/packages"
            onMouseLeave={() => setHoveredPkg(null)}
        >
          {PACKAGES.map((pkg) => (
            <div 
                key={pkg.id} 
                className={`min-w-0 transition-all duration-500 ${hoveredPkg && hoveredPkg !== pkg.id ? 'blur-sm opacity-50 scale-95' : 'scale-100 opacity-100'}`}
                onMouseEnter={() => setHoveredPkg(pkg.id)}
            >
              <div className="group relative rounded-[32px] overflow-hidden transition-all duration-700 hover:shadow-2xl h-full flex flex-col glass-panel shadow-sm hover:-translate-y-2">
                <div className="p-8 flex-1 flex flex-col justify-between bg-white/40 backdrop-blur-md">
                  <div>
                    <h3 className="text-2xl font-extrabold mb-4 text-stone-900 tracking-tight leading-tight">
                        {language === 'ko' ? pkg.title.ko : pkg.title.en}
                    </h3>
                    <ul className="space-y-4 mb-8">
                      {(language === 'ko' ? pkg.features.ko : pkg.features.en).map((feat, idx) => (
                        <li key={idx} className="flex items-start text-xs md:text-sm text-stone-600 font-bold tracking-tight">
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto pt-8 border-t border-stone-200">
                    <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Price</span>
                    <div className="text-lg font-space font-medium text-stone-800">{pkg.price}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View: Button & Drawer */}
        <div className="md:hidden flex justify-center">
            <button 
                onClick={openDrawer}
                className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold text-sm tracking-widest shadow-lg hover:bg-black transition-transform active:scale-95 hover:scale-105"
            >
                {language === 'ko' ? '상품 상세보기' : 'VIEW PACKAGES'}
            </button>
        </div>

        {/* Mobile Drawer */}
        {isDrawerOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                <div 
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
                    onClick={closeDrawer}
                ></div>
                <div 
                    className={`bg-[#e7e5e4] w-full h-[85vh] rounded-t-[40px] relative z-10 flex flex-col pointer-events-auto transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                >
                    <div className="flex justify-center pt-4 pb-2" onClick={closeDrawer}>
                        <div className="w-16 h-1.5 bg-stone-300 rounded-full"></div>
                    </div>
                    <div className="px-8 pb-6 flex justify-between items-center border-b border-stone-300/50">
                        <h3 className="font-bold text-lg text-stone-800 uppercase tracking-widest">Packages</h3>
                        <button onClick={closeDrawer} className="p-2 bg-stone-200 rounded-full text-stone-600"><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {PACKAGES.map((pkg) => (
                            <div key={pkg.id} className="glass-panel p-8 rounded-[32px] bg-white/60">
                                <h3 className="text-2xl font-extrabold mb-2 text-stone-900">{language === 'ko' ? pkg.title.ko : pkg.title.en}</h3>
                                <div className="text-3xl font-space font-light text-stone-900 mb-6">{pkg.price}</div>
                                <ul className="space-y-3">
                                    {(language === 'ko' ? pkg.features.ko : pkg.features.en).map((feat, idx) => (
                                        <li key={idx} className="flex items-start text-stone-800 font-bold tracking-tight">
                                         {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};

// --- Homepage Reviews Section (Updated) ---

const ReviewsHomeSection: React.FC = () => {
    const { language, reviews } = useAppContext();
    const [lightbox, setLightbox] = useState<LightboxState>(null);
    
    // Sort reviews by date descending (Newest first)
    const sortedReviews = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Create an extended list for marquee effect (duplicate the sorted list)
    const extendedReviews = [...sortedReviews, ...sortedReviews, ...sortedReviews];

    return (
        <section id="reviews" className="py-16 md:py-24 overflow-hidden relative">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="text-center">
                    <h2 className="font-outfit text-4xl md:text-6xl text-stone-900 mb-4 tracking-tighter font-bold">
                        REVIEWS <span className="font-normal mx-2">by</span> CLIENT
                    </h2>
                    <p className="text-stone-500 font-medium text-sm max-w-lg mx-auto mb-8">
                        {language === 'ko' ? '소중한 순간을 함께한 분들의 이야기' : 'Stories from our lovely guests'}
                    </p>
                </div>
             </div>

             {/* Infinite Marquee for Reviews - Removed hover pause */}
             <div className="w-full overflow-hidden mask-linear-fade">
                <div className="flex w-max animate-marquee-slow">
                    {extendedReviews.map((review, idx) => (
                        <ReviewCard 
                            key={`${review.id}-${idx}`} 
                            review={review} 
                            onImageClick={(photos, index) => setLightbox({ images: photos, index })} 
                        />
                    ))}
                </div>
             </div>

             {/* View More Button */}
             <div className="text-center mt-12">
                <Link 
                    to="/reviews" 
                    className="group inline-flex items-center justify-center bg-yellow-400 text-stone-900 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(250,204,21,0.6)] transition-all duration-300 active:scale-95"
                >
                    {language === 'ko' ? '더보기' : 'VIEW MORE'}
                </Link>
            </div>

            {/* Lightbox Modal (Reused) */}
            {lightbox && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-fade-in"
                    onClick={() => setLightbox(null)}
                >
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition z-50">
                        <X size={32} />
                    </button>
                    
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                            src={lightbox.images[lightbox.index]} 
                            alt="Review Fullscreen" 
                            className="w-auto h-auto max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm"
                            onClick={e => e.stopPropagation()} 
                        />
                    </div>
                </div>
            )}
        </section>
    )
}

// New Meeting Point Section - Updated Title Style and Button Links
const MeetingPointSection: React.FC = () => {
    const { language, content } = useAppContext();
    return (
        <section id="location" className="py-12 md:py-16 bg-stone-50">
             <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="font-outfit text-3xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">
                        MEET <span className="font-light mx-2">with</span> HEUM
                    </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {content.meetingPoints.map(point => (
                        <div key={point.id} className="bg-white p-5 rounded-[24px] shadow-sm flex flex-col items-center text-center hover:shadow-md transition">
                            <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center mb-3 text-stone-800">
                                {point.id === 'tower' ? <MapPin size={20} /> : <Clock size={20} />}
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-stone-900">{language === 'ko' ? point.title.ko : point.title.en}</h3>
                            <p className="text-stone-600 text-xs font-medium leading-relaxed mb-4 whitespace-pre-line">
                                {language === 'ko' ? point.description.ko : point.description.en}
                            </p>
                            <p className="text-stone-400 text-[10px] mb-4">{point.address}</p>
                            
                            <a 
                                href={point.googleMapUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-5 py-2 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition"
                            >
                                MAP
                            </a>
                        </div>
                    ))}
                </div>
             </div>
        </section>
    );
};

const NoticeSection: React.FC = () => {
    const { language } = useAppContext();
    return (
        <section id="notice" className="py-20 bg-stone-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="font-outfit text-3xl md:text-4xl font-bold text-stone-900 mb-4">
                        {language === 'ko' ? "유의사항" : "NOTICE"}
                    </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {NOTICES.map(notice => (
                        <div key={notice.id} className="bg-white p-8 rounded-[24px] shadow-sm hover:shadow-md transition">
                            {/* Icons removed as requested */}
                            <h3 className="font-bold text-lg mb-3 text-stone-900">{language === 'ko' ? notice.title.ko : notice.title.en}</h3>
                            <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">
                                {language === 'ko' ? notice.description.ko : notice.description.en}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PortfolioPage: React.FC = () => {
    const { content, language } = useAppContext();
    useEffect(() => { window.scrollTo(0, 0); }, []);
    
    // Combine all images for masonry view, randomizing order slightly for "collage" feel could be added here
    // For now, we sequentially render albums in masonry
    return (
        <div className="min-h-screen pt-32 pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
             <div className="text-center mb-16">
                 <h1 className="font-outfit text-4xl md:text-6xl font-bold mb-4">{language === 'ko' ? "포트폴리오" : "PORTFOLIO"}</h1>
                 <p className="text-stone-500 tracking-widest uppercase text-sm">Stills by Heum</p>
            </div>
            
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {content.portfolio.flatMap(album => album.images).map((img, idx) => (
                    <div key={idx} className="break-inside-avoid rounded-2xl overflow-hidden shadow-md group relative">
                        <img src={img} alt="" className="w-full h-auto transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300 pointer-events-none"></div>
                    </div>
                ))}
            </div>

            <div className="mt-20 text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-black transition uppercase tracking-widest text-xs font-bold">
                    <ChevronLeft size={14} /> {language === 'ko' ? "홈으로 돌아가기" : "Back to Home"}
                </Link>
            </div>
        </div>
    );
};

// State type for lightbox navigation
type LightboxState = {
    images: string[];
    index: number;
} | null;

const ReviewsPage: React.FC = () => {
    const { reviews, language, addReview } = useAppContext();
    const [showForm, setShowForm] = useState(false);
    const [newReview, setNewReview] = useState<{
        email: string; password: string; author: string; content: string; photos: string[]
    }>({ email: '', password: '', author: '', content: '', photos: ['', '', '', '', ''] });
    
    // Updated Lightbox State
    const [lightbox, setLightbox] = useState<LightboxState>(null);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReview.email || !newReview.password || !newReview.content || !newReview.author) {
            alert("Please fill all required fields.");
            return;
        }
        
        const validPhotos = newReview.photos.filter(p => p.trim() !== "");
        // Fallback photo if none provided
        const finalPhotos = validPhotos.length > 0 ? validPhotos : ["https://images.unsplash.com/photo-1520854221256-17451cc330e7?q=80&w=200"];

        addReview({
            id: Date.now().toString(),
            email: newReview.email,
            password: newReview.password,
            author: newReview.author,
            content: newReview.content,
            date: new Date().toLocaleDateString(),
            rating: 5,
            photos: finalPhotos
        });
        setNewReview({ email: '', password: '', author: '', content: '', photos: ['', '', '', '', ''] });
        setShowForm(false);
    };

    const handlePhotoChange = (idx: number, val: string) => {
        const updated = [...newReview.photos];
        updated[idx] = val;
        setNewReview({...newReview, photos: updated});
    }

    // Lightbox Navigation Handlers
    const nextLightboxImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightbox) {
            setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length });
        }
    };

    const prevLightboxImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lightbox) {
            setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length });
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                 <h1 className="font-outfit text-4xl md:text-6xl font-bold mb-4">{language === 'ko' ? "고객 후기" : "REVIEWS"}</h1>
                 <p className="text-stone-500 tracking-widest uppercase text-sm">Guest Stories</p>
                 <button 
                    onClick={() => setShowForm(!showForm)}
                    className="mt-8 bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition"
                >
                    {showForm ? 'Cancel' : (language === 'ko' ? '리뷰 남기기' : 'Write a Review')}
                </button>
            </div>

            {showForm && (
                <div className="glass-panel p-8 rounded-3xl mb-12 animate-pop-in max-w-2xl mx-auto">
                    <h3 className="font-bold text-lg mb-6">Write your story</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="grid md:grid-cols-2 gap-4">
                            <input 
                                placeholder="Name" 
                                className="w-full bg-white/50 p-3 rounded-xl border border-stone-200 text-sm"
                                value={newReview.author}
                                onChange={e => setNewReview({...newReview, author: e.target.value})}
                                required
                            />
                            <input 
                                placeholder="Email (Private)" 
                                type="email"
                                className="w-full bg-white/50 p-3 rounded-xl border border-stone-200 text-sm"
                                value={newReview.email}
                                onChange={e => setNewReview({...newReview, email: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                             <p className="text-xs font-bold text-stone-400 uppercase">Photos (Max 5 URLs)</p>
                             {newReview.photos.map((photo, idx) => (
                                 <input 
                                    key={idx}
                                    placeholder={`Photo URL #${idx + 1} (Optional)`} 
                                    className="w-full bg-white/50 p-3 rounded-xl border border-stone-200 text-sm"
                                    value={photo}
                                    onChange={e => handlePhotoChange(idx, e.target.value)}
                                />
                             ))}
                        </div>

                        <input 
                            placeholder="Password (for deletion)" 
                            type="password"
                            className="w-full bg-white/50 p-3 rounded-xl border border-stone-200 text-sm"
                            value={newReview.password}
                            onChange={e => setNewReview({...newReview, password: e.target.value})}
                            required
                        />
                        <textarea 
                            placeholder="Your review..." 
                            rows={4}
                            className="w-full bg-white/50 p-3 rounded-xl border border-stone-200 text-sm"
                            value={newReview.content}
                            onChange={e => setNewReview({...newReview, content: e.target.value})}
                            required
                        />
                        <button type="submit" className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black">
                            Post Review
                        </button>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map(review => (
                    <ReviewCard 
                        key={review.id} 
                        review={review} 
                        onImageClick={(photos, index) => setLightbox({ images: photos, index })} 
                    />
                ))}
            </div>
            
            <div className="mt-20 text-center">
                <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-black transition uppercase tracking-widest text-xs font-bold">
                    <ChevronLeft size={14} /> {language === 'ko' ? "홈으로 돌아가기" : "Back to Home"}
                </Link>
            </div>

            {/* Lightbox Modal */}
            {lightbox && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-fade-in"
                    onClick={() => setLightbox(null)}
                >
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition z-50">
                        <X size={32} />
                    </button>
                    
                    {/* Main Image - Full Width/Height container for impact */}
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                            src={lightbox.images[lightbox.index]} 
                            alt="Review Fullscreen" 
                            className="w-auto h-auto max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm"
                            onClick={e => e.stopPropagation()} 
                        />
                    </div>

                    {/* Navigation Arrows for Lightbox */}
                    {lightbox.images.length > 1 && (
                        <>
                            <button 
                                onClick={prevLightboxImage}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition"
                            >
                                <ChevronLeft size={40} />
                            </button>
                            <button 
                                onClick={nextLightboxImage}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition"
                            >
                                <ChevronRight size={40} />
                            </button>
                            
                            {/* Counter */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm font-bold tracking-widest">
                                {lightbox.index + 1} / {lightbox.images.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Admin Page ---

const AdminPage: React.FC = () => {
    const { adminUser, loginAdmin, logoutAdmin, content, updateContent } = useAppContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState<'content' | 'images' | 'meeting'>('content');

    if (!adminUser.isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="glass-panel p-10 rounded-3xl w-full max-w-md text-center">
                    <Lock size={40} className="mx-auto mb-6 text-stone-400" />
                    <h2 className="text-2xl font-bold mb-6">Admin Access</h2>
                    <form onSubmit={(e) => { e.preventDefault(); if(!loginAdmin(email, password)) alert("Invalid Access"); }}>
                        <input 
                            type="email" 
                            className="w-full p-4 rounded-xl border border-stone-200 mb-4" 
                            placeholder="Enter Admin Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                         <input 
                            type="password" 
                            className="w-full p-4 rounded-xl border border-stone-200 mb-4" 
                            placeholder="Enter Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto">
             <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={logoutAdmin} className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs"><LogOut size={16}/> Logout</button>
             </div>

             <div className="flex gap-4 mb-8">
                 <button onClick={() => setActiveTab('content')} className={`px-6 py-2 rounded-full font-bold text-xs uppercase ${activeTab === 'content' ? 'bg-black text-white' : 'bg-white text-stone-500'}`}>Text Content</button>
                 <button onClick={() => setActiveTab('images')} className={`px-6 py-2 rounded-full font-bold text-xs uppercase ${activeTab === 'images' ? 'bg-black text-white' : 'bg-white text-stone-500'}`}>Images</button>
                 <button onClick={() => setActiveTab('meeting')} className={`px-6 py-2 rounded-full font-bold text-xs uppercase ${activeTab === 'meeting' ? 'bg-black text-white' : 'bg-white text-stone-500'}`}>Meeting Points</button>
             </div>

             {activeTab === 'content' && (
                 <div className="grid gap-6">
                     <div className="glass-panel p-6 rounded-2xl">
                         <h3 className="font-bold mb-4">Hero Section</h3>
                         <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">Title (KO)</label>
                                <input className="w-full p-2 border rounded" value={content.heroTitle.ko} onChange={e => updateContent('heroTitle', 'ko', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">Title (EN)</label>
                                <input className="w-full p-2 border rounded" value={content.heroTitle.en} onChange={e => updateContent('heroTitle', 'en', e.target.value)} />
                            </div>
                         </div>
                     </div>
                      <div className="glass-panel p-6 rounded-2xl">
                         <h3 className="font-bold mb-4">Pricing Title</h3>
                         <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">Title (KO)</label>
                                <input className="w-full p-2 border rounded" value={content.pricingTitle.ko} onChange={e => updateContent('pricingTitle', 'ko', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">Title (EN)</label>
                                <input className="w-full p-2 border rounded" value={content.pricingTitle.en} onChange={e => updateContent('pricingTitle', 'en', e.target.value)} />
                            </div>
                         </div>
                     </div>
                     <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold mb-4">Background Music</h3>
                        <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1">Music URL (MP3)</label>
                            <input 
                                className="w-full p-2 border rounded" 
                                value={content.backgroundMusicUrl} 
                                onChange={e => updateContent('backgroundMusicUrl', '', e.target.value)} 
                            />
                        </div>
                     </div>
                 </div>
             )}

             {activeTab === 'images' && (
                 <div className="glass-panel p-6 rounded-2xl">
                     <h3 className="font-bold mb-4">Portfolio Covers</h3>
                     {content.portfolio.map((album, idx) => (
                         <div key={album.id} className="mb-4">
                             <label className="block text-xs font-bold text-stone-400 mb-1">{album.title.en} Cover URL</label>
                             <input className="w-full p-2 border rounded" value={album.cover} onChange={(e) => {
                                 const newPortfolio = [...content.portfolio];
                                 newPortfolio[idx].cover = e.target.value;
                                 updateContent('portfolio', '', newPortfolio); 
                             }} />
                             <img src={album.cover} className="w-20 h-20 object-cover mt-2 rounded" />
                         </div>
                     ))}
                 </div>
             )}
             
             {activeTab === 'meeting' && (
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="font-bold mb-4">Meeting Points</h3>
                    {content.meetingPoints.map((point, idx) => (
                        <div key={point.id} className="mb-6 border-b border-stone-200 pb-4 last:border-0">
                            <h4 className="font-bold text-sm mb-2 uppercase">{point.id}</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 mb-1">Google Maps URL</label>
                                    <input 
                                        className="w-full p-2 border rounded" 
                                        value={point.googleMapUrl} 
                                        onChange={(e) => {
                                            const newPoints = [...content.meetingPoints];
                                            newPoints[idx].googleMapUrl = e.target.value;
                                            updateContent('meetingPoints', '', newPoints);
                                        }} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 mb-1">Address</label>
                                    <input 
                                        className="w-full p-2 border rounded" 
                                        value={point.address} 
                                        onChange={(e) => {
                                            const newPoints = [...content.meetingPoints];
                                            newPoints[idx].address = e.target.value;
                                            updateContent('meetingPoints', '', newPoints);
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
             
             <div className="mt-10 p-6 bg-yellow-50 rounded-2xl border border-yellow-200">
                 <h3 className="font-bold mb-4 flex items-center gap-2"><CalendarIcon size={16}/> Booking Management</h3>
                 <div className="bg-white p-4 rounded-xl">
                     <CalendarView isAdmin={true} />
                 </div>
             </div>
        </div>
    );
};

// Updated Footer to be Fixed
const Footer: React.FC = () => {
  const { content } = useAppContext();
  return (
    <footer className="fixed bottom-0 left-0 w-full z-0 h-[400px] flex items-end justify-center bg-[#0c0c0c] text-white py-10 md:py-20">
       <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
         <div>
           <h3 className="text-white font-outfit font-bold text-2xl tracking-tighter">STILLS<span className="font-normal text-stone-400">by</span>HEUM</h3>
           <p className="mt-3 font-outfit text-stone-400 text-xs tracking-widest uppercase">Based in London</p>
         </div>
         <div className="text-xs text-left md:text-right font-medium space-y-3 tracking-wide text-stone-400">
           <p>© 2024 Stills by Heum. All rights reserved.</p>
           <a href={content.instagramUrl} target="_blank" rel="noreferrer" className="block hover:text-white transition">Instagram: @Heum_London</a>
           <a href={content.kakaoUrl} target="_blank" rel="noreferrer" className="block hover:text-white transition">카카오톡 오픈채팅 : 흠작가</a>
           <div className="pt-4">
             <Link to="/admin" className="hover:text-white transition underline decoration-stone-600 text-[10px] uppercase tracking-widest">Admin Login</Link>
           </div>
         </div>
       </div>
    </footer>
  );
};

// --- Provider with Auto-Reviews ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('ko');
    const [content, setContent] = useState<ContentData>(INITIAL_CONTENT);
    const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({});
    const [adminUser, setAdminUser] = useState<AdminUser>({ email: '', isAuthenticated: false });
    const [galleryFilter, setGalleryFilter] = useState<string>('all');
    const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
    const [isPlaying, setIsPlaying] = useState(true); // Default to True
    const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Auto-Review Simulation
    useEffect(() => {
        // Simulate checking date to add new weekly reviews
        if (reviews.length < 5) {
             const newReview1: Review = {
                 id: `auto-${Date.now()}`,
                 email: 'auto@bot.com',
                 author: '재원이형',
                 content: '흠작가님 덕분에 인생샷 건졌습니다! ㅋㅋ 진짜 편안하게 해주셔서 표정이 다 자연스럽게 나왔네요. 형님 적게 일하고 많이 버세요!',
                 date: new Date().toLocaleDateString(),
                 rating: 5,
                 photos: ["https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=200"]
             };
              const newReview2: Review = {
                 id: `auto-${Date.now()}+1`,
                 email: 'auto2@bot.com',
                 author: 'Suzy',
                 content: '작가님 진짜 금손... 보정도 너무 자연스럽고 분위기 미쳤어요 ㅠㅠ 친구들이 다 어디서 찍었냐고 물어봐요! 짱짱맨!',
                 date: new Date().toLocaleDateString(),
                 rating: 5,
                 photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"]
             };
             setReviews(prev => [newReview1, newReview2, ...prev]);
        }
    }, []);

    // Audio Logic - Updated to allow dynamic URL change
    useEffect(() => {
        if (!audioRef.current) {
            const audio = new Audio(content.backgroundMusicUrl); 
            audio.loop = true;
            audio.volume = 0.4;
            audioRef.current = audio;
        } else {
            // Update source if content changes
            if (audioRef.current.src !== content.backgroundMusicUrl) {
                audioRef.current.src = content.backgroundMusicUrl;
                if (isPlaying) {
                    audioRef.current.play().catch(e => console.error("Play error after src change:", e));
                }
            }
        }
    }, [content.backgroundMusicUrl]); // Depend on URL change

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error("Auto-play prevented by browser policy.", e);
                    setIsPlaying(false); // Update state to reflect reality (paused)
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Force Play on First Interaction
    useEffect(() => {
        const handleInteraction = () => {
            if (audioRef.current && audioRef.current.paused && isPlaying) {
                 audioRef.current.play().catch(() => {});
            }
        };
        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, [isPlaying]);

    const toggleAudio = () => setIsPlaying(prev => !prev);

    const updateContent = (key: keyof ContentData, subKey: string, value: any) => {
        setContent(prev => {
            if (subKey && typeof prev[key] === 'object' && !Array.isArray(prev[key])) {
                return { ...prev, [key]: { ...prev[key], [subKey]: value } };
            }
            if (key === 'portfolio') return { ...prev, portfolio: value };
            return { ...prev, [key]: value };
        });
    };

    const toggleSlot = (date: string, slotId: string, action: 'book' | 'block', details?: any) => {
        setSchedule(prev => {
            const day = prev[date] || { date, slots: [] };
            const existingSlot = day.slots.find(s => s.id === slotId);
            let newSlots;
            if (existingSlot) {
                newSlots = day.slots.map(s => s.id === slotId ? {
                    ...s,
                    isBooked: action === 'book' ? !s.isBooked : s.isBooked,
                    isBlocked: action === 'block' ? !s.isBlocked : s.isBlocked
                } : s);
            } else {
                newSlots = [...day.slots, { id: slotId, time: slotId, isBooked: action === 'book', isBlocked: action === 'block' }];
            }
            return { ...prev, [date]: { ...day, slots: newSlots } };
        });
    };

    const requestBooking = (date: string, slotId: string) => {
        setSchedule(prev => {
            const day = prev[date] || { date, slots: [] };
            const existingSlot = day.slots.find(s => s.id === slotId);
            let newSlots;
            if (existingSlot) {
                newSlots = day.slots.map(s => s.id === slotId ? {
                    ...s,
                    // If it's already booked, just increment count. If not, set booked.
                    // For logic simplicity, let's say requestBooking just adds count
                    count: (s.count || 0) + 1,
                    isBooked: true // Mark as booked if at least one person booked
                } : s);
            } else {
                newSlots = [...day.slots, { id: slotId, time: slotId, isBooked: true, isBlocked: false, count: 1 }];
            }
            return { ...prev, [date]: { ...day, slots: newSlots } };
        });
    };

    const loginAdmin = (email: string, password?: string) => {
        if (email === 'maiminimum9@gmail.com' && password === '0629') {
            setAdminUser({ email, isAuthenticated: true });
            return true;
        }
        return false;
    };
    const logoutAdmin = () => setAdminUser({ email: '', isAuthenticated: false });
    const addReview = (review: Review) => setReviews(prev => [review, ...prev]);
    const deleteReview = (id: string) => setReviews(prev => prev.filter(r => r.id !== id));
    
    // Placeholders
    const addPortfolioAlbum = (album: PortfolioAlbum) => setContent(prev => ({...prev, portfolio: [...prev.portfolio, album]}));
    const addPortfolioImage = (albumId: string, imageUrl: string) => setContent(prev => ({...prev, portfolio: prev.portfolio.map(a => a.id === albumId ? {...a, images: [...a.images, imageUrl]} : a)}));
    const addFAQ = (faq: FAQItem) => setContent(prev => ({...prev, faqs: [...prev.faqs, faq]}));
    const updateFAQ = (faq: FAQItem) => setContent(prev => ({...prev, faqs: prev.faqs.map(f => f.id === faq.id ? faq : f)}));
    const deleteFAQ = (id: string) => setContent(prev => ({...prev, faqs: prev.faqs.filter(f => f.id !== id)}));

    return (
        <AppContext.Provider value={{
            language, setLanguage, content, updateContent, schedule, toggleSlot,
            adminUser, loginAdmin, logoutAdmin, galleryFilter, setGalleryFilter,
            reviews, addReview, deleteReview, addPortfolioAlbum, addPortfolioImage,
            addFAQ, updateFAQ, deleteFAQ, isPlaying, toggleAudio, requestBooking,
            selectedAlbum, setSelectedAlbum
        }}>
            {children}
        </AppContext.Provider>
    );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
      if (showSplash) {
          const timer = setTimeout(() => {
              setIsFinishing(true);
              setTimeout(() => {
                  setShowSplash(false);
                  // Allow the scale-in animation to play out (0.8s) then remove transform
                  setTimeout(() => {
                      setAnimationComplete(true);
                  }, 800);
              }, 800); 
          }, 2000); // Duration of black screen
          return () => clearTimeout(timer);
      }
  }, [showSplash]);

  return (
    <AppProvider>
      <GrainOverlay />
      {showSplash && <SplashScreen onFinish={() => {}} isFinishing={isFinishing} />}
      <Router>
        {/*
            If 'animate-ios-scale-in' (transform) is active, fixed children (Navbar/BottomBar) 
            lose their viewport anchoring. 
            We must remove the class/transform once the animation is done.
        */}
        <div className={`font-sans text-stone-900 min-h-screen selection:bg-stone-200 selection:text-black ${isFinishing && !animationComplete ? 'animate-ios-scale-in' : ''}`}>
           <Navbar />
           <Routes>
             <Route path="/" element={
                 // Main Content wrapper with z-index to cover footer and margin-bottom to reveal it
                 <main className="relative z-10 bg-[#e6e6e6] mb-[400px] shadow-2xl rounded-b-[40px] border-b border-stone-200">
                    <HeroSection />
                    <PortfolioHomeSection />
                    <PackagesSection />
                    <ReviewsHomeSection />
                    <MeetingPointSection />
                    <NoticeSection />
                 </main>
             } />
             <Route path="/portfolio" element={<main className="relative z-10 bg-[#e6e6e6] mb-[400px] shadow-2xl rounded-b-[40px] border-b border-stone-200"><PortfolioPage /></main>} />
             <Route path="/reviews" element={<main className="relative z-10 bg-[#e6e6e6] mb-[400px] shadow-2xl rounded-b-[40px] border-b border-stone-200"><ReviewsPage /></main>} />
             <Route path="/admin" element={<main className="relative z-10 bg-[#e6e6e6] min-h-screen"><AdminPage /></main>} />
           </Routes>
           <Footer />
           <BottomBar />
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;