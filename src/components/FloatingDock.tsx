import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Calendar as CalendarIcon } from 'lucide-react';
import SimpleSmile from './SimpleSmile';

const FloatingDock: React.FC<{ onOpenFAQ: () => void; onToggleMenu: () => void }> = ({ onOpenFAQ, onToggleMenu }) => {
    return (
        <div className="w-full flex justify-center py-8 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-900">
            <div className="flex items-center gap-4">
                {/* Admin Button */}
                <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-900 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
                    <Lock size={14} />
                </Link>

                {/* AI Button */}
                <button onClick={onOpenFAQ} className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-xs uppercase tracking-tighter hover:scale-105 transition-transform shadow-lg">
                    <SimpleSmile size={18} className="text-white dark:text-black" />
                    <span>HEUM's AI</span>
                </button>

                {/* Booking Button */}
                <div className="relative">
                    <button onClick={onToggleMenu} className="flex items-center justify-center w-12 h-12 bg-stone-100 dark:bg-stone-900 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-stone-900 dark:text-stone-100">
                        <CalendarIcon size={20} />
                    </button>
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce shadow-sm border-2 border-white dark:border-stone-950" />
                </div>
            </div>
        </div>
    );
};

export default FloatingDock;
