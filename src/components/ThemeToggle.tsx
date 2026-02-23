import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useAppContext();

    return (
        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>
    );
};

export default ThemeToggle;
