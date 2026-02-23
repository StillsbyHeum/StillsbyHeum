
export type Language = 'ko' | 'en';

export interface TimeSlot {
  id: string;
  time: string; // "10:00"
  isBooked: boolean;
  isBlocked: boolean; // Admin blocked
  count?: number; // Number of people booked
}

export interface DaySchedule {
  date: string; // "2023-10-27"
  slots: TimeSlot[];
}

export interface Review {
  id: string;
  email: string;
  password?: string; // For user deletion
  author: string;
  content: string;
  date: string;
  rating: number;
  photos: string[]; // Changed from optional single string to array
}

export interface PortfolioAlbum {
  id: string;
  title: { ko: string; en: string };
  cover: string;
  images: string[];
}

export interface FAQItem {
  id: string;
  q: { ko: string; en: string };
  a: { ko: string; en: string };
}

export interface MeetingPoint {
  id: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  address: string;
  googleMapUrl: string;
}

export interface MenuItem {
  id: string;
  ko: string;
  en: string;
}

export interface PackageItem {
  id: string;
  title: { ko: string; en: string };
  price: string;
  features: { ko: string[]; en: string[] };
  color: string;
  image: string; // URL for the package card background/preview
}

export interface NoticeItem {
  id: string;
  icon: any; // Lucide icon name or component
  title: { ko: string; en: string };
  description: { ko: string; en: string };
}

export interface AILog {
  id: string;
  timestamp: string;
  question: string;
  answer: string;
}

export interface ContentData {
  heroTitle: { ko: string; en: string };
  heroSubtitle: { ko: string; en: string };
  artistGreeting: { ko: string; en: string };
  artistPhoto: string;
  worksTitle: { ko: string; en: string };
  worksSubtitle: { ko: string; en: string };
  pricingTitle: { ko: string; en: string };
  pricingSubtitle: { ko: string; en: string };
  noticeTitle: { ko: string; en: string };
  noticeSubtitle: { ko: string; en: string };
  instagramUrl: string;
  kakaoUrl: string;
  collageImages: string[];
  fontTheme: 'modern' | 'serif';
  portfolio: PortfolioAlbum[];
  homePortfolioImages: string[];
  faqs: FAQItem[];
  backgroundMusicUrl: string;
  meetingPoints: MeetingPoint[];
  menuItems: MenuItem[];
  notices: NoticeItem[];
  packages: PackageItem[]; 
  aiContext: string; // Admin defined context for AI
  aiLogs: AILog[]; // Log of AI interactions
  aiQuickQuestions: string[]; // List of suggested questions for the AI widget
  schedule: DaySchedule[]; // Admin managed schedule
}

export type AdminUser = {
  email: string;
  isAuthenticated: boolean;
};