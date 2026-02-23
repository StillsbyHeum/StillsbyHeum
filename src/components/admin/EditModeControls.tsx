import React from 'react';
import { Save, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const EditModeControls: React.FC = () => {
    const { isEditMode, toggleEditMode, saveToLocalStorage } = useAppContext();

    if (!isEditMode) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 animate-slide-in-right">
            <div className="bg-black/80 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/20">
                <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-green-400">Edit Mode Active</h3>
                <p className="text-xs text-stone-300 mb-4">Click on any outlined text or image to edit.</p>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={saveToLocalStorage}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-xl font-bold text-sm transition-colors shadow-lg"
                    >
                        <Save size={16} />
                        Save All Changes
                    </button>
                    <button 
                        onClick={toggleEditMode}
                        className="flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 text-white py-2 px-4 rounded-xl font-bold text-sm transition-colors"
                    >
                        <X size={16} />
                        Exit Edit Mode
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModeControls;
