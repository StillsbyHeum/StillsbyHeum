import React from 'react';
import { useNavigate } from 'react-router-dom';

const TempAdminButton: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/heum-admin-secure')}
            className="fixed bottom-6 right-6 z-[9999] bg-[#FF0000] text-white px-5 py-3 rounded-full font-bold shadow-xl hover:bg-red-700 transition-all hover:scale-105 text-xs tracking-widest flex items-center gap-2"
        >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>
            ADMIN ACCESS
        </button>
    );
};

export default TempAdminButton;
