import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useAppContext();

    return (
        <button 
            onClick={toggleTheme}
            className="text-editorial-micro opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? 'DARK MODE' : 'LIGHT MODE'}
        </button>
    );
};

export default ThemeToggle;
