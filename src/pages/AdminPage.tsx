import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import GeneralTab from '../components/admin/GeneralTab';
import PackagesTab from '../components/admin/PackagesTab';
import PortfolioTab from '../components/admin/PortfolioTab';
import ReviewsTab from '../components/admin/ReviewsTab';
import ScheduleTab from '../components/admin/ScheduleTab';
import { Edit3, LogOut, ShieldCheck } from 'lucide-react';

const AdminPage: React.FC = () => {
    const { isAdmin, login, loginAsDev, logout, isEditMode, toggleEditMode, user, saveToLocalStorage } = useAppContext();
    const [activeTab, setActiveTab] = useState<'general' | 'packages' | 'notices' | 'portfolio' | 'reviews' | 'schedule'>('general');
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const success = await login();
            if (success) {
                setError("");
            }
        } catch (err: any) {
            if (err.message === "DEV_MODE_REQUIRED") {
                setError("Firebase API Key missing. Please use 'Enter Dev Mode' below.");
            } else {
                setError(err.message || "Login failed");
            }
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-stone-100 rounded-full">
                            <ShieldCheck size={48} className="text-stone-800" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
                    <p className="text-stone-500 mb-8 text-sm">Restricted area. Authorized personnel only.</p>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={handleLogin} 
                        className="w-full bg-black text-white py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-lg mb-4"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Sign in with Google
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-stone-200"></div>
                        <span className="flex-shrink-0 mx-4 text-stone-400 text-xs">Development Only</span>
                        <div className="flex-grow border-t border-stone-200"></div>
                    </div>

                    <button 
                        onClick={loginAsDev} 
                        className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors text-sm mt-2"
                    >
                        Enter Dev Mode (No Auth)
                    </button>
                    
                    <p className="mt-6 text-[10px] text-stone-400">
                        Secure authentication powered by Firebase.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 px-4 pb-32 w-full max-w-7xl mx-auto overflow-x-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-center md:text-left">Admin Dashboard</h2>
                    <p className="text-stone-500 text-sm mt-1 font-mono">Logged in as: {user?.email}</p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={saveToLocalStorage}
                        className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        Save Changes
                    </button>
                    <button 
                        onClick={() => {
                            toggleEditMode();
                            navigate('/');
                        }}
                        className={`px-6 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${isEditMode ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                        <Edit3 size={16} />
                        {isEditMode ? 'Editing Active' : 'Start Inline Edit'}
                    </button>
                    <button 
                        onClick={logout} 
                        className="px-6 py-2 bg-stone-200 rounded-full font-bold text-sm hover:bg-stone-300 transition-colors flex items-center gap-2"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {['general', 'packages', 'portfolio', 'reviews', 'schedule'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab ? 'bg-black text-white' : 'bg-white border border-stone-200 hover:bg-stone-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white p-4 md:p-8 rounded-[2rem] shadow-sm border border-stone-100 min-h-[500px] overflow-hidden text-stone-900">
                {activeTab === 'general' && <GeneralTab />}
                {activeTab === 'packages' && <PackagesTab />}
                {activeTab === 'portfolio' && <PortfolioTab />}
                {activeTab === 'reviews' && <ReviewsTab />}
                {activeTab === 'schedule' && <ScheduleTab />}
            </div>
        </div>
    );
};

export default AdminPage;
