import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocationSelectionProps {
    selectedLocations: string[];
    language: 'ko' | 'en';
    onBack: () => void;
    onLocationSelect: (loc: string) => void;
    onNext: () => void;
}

const LocationSelection: React.FC<LocationSelectionProps> = ({
    selectedLocations,
    language,
    onBack,
    onLocationSelect,
    onNext
}) => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                <h3 className="text-xl font-bold">{language === 'ko' ? '장소 선택 (복수 선택 가능)' : 'Select Location (Multiple)'}</h3>
            </div>
            <div className="space-y-3">
                {['Big Ben & London Eye', 'Tower Bridge', 'Notting Hill', 'Shoreditch', 'Hyde Park', 'Soho'].map(loc => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                        <button 
                            key={loc} 
                            onClick={() => onLocationSelect(loc)}
                            className={`w-full py-4 px-6 text-left border rounded-2xl text-sm font-bold transition-all shadow-sm flex justify-between items-center ${
                                isSelected 
                                ? 'bg-black text-white border-black scale-[1.02]' 
                                : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                            }`}
                        >
                            <span>{loc}</span>
                            {isSelected && <Check size={16} />}
                        </button>
                    );
                })}
            </div>
            <div className="mt-auto pt-6 border-t border-stone-200">
                <button 
                    onClick={onNext}
                    disabled={selectedLocations.length === 0}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {language === 'ko' ? '다음 단계' : 'Next Step'}
                </button>
            </div>
        </motion.div>
    );
};

export default LocationSelection;
