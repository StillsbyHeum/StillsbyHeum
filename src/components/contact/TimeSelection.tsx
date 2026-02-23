import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { DEFAULT_SLOTS } from '../../constants';

interface TimeSelectionProps {
    selectedDate: Date;
    selectedTimes: string[];
    language: 'ko' | 'en';
    onBack: () => void;
    onTimeSelect: (time: string) => void;
    onNext: () => void;
}

const TimeSelection: React.FC<TimeSelectionProps> = ({
    selectedDate,
    selectedTimes,
    language,
    onBack,
    onTimeSelect,
    onNext
}) => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                <h3 className="text-xl font-bold">{language === 'ko' ? '시간 선택 (런던 기준)' : 'Select Time (London)'}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {DEFAULT_SLOTS.map(slot => {
                    const isSelected = selectedTimes.includes(slot);
                    return (
                        <button 
                            key={slot} 
                            onClick={() => onTimeSelect(slot)}
                            className={`py-3 px-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${
                                isSelected 
                                    ? 'bg-black text-white border-black scale-105' 
                                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                            }`}
                        >
                            {slot}
                        </button>
                    );
                })}
            </div>
            <div className="mt-auto pt-6 border-t border-stone-200">
                <button 
                    onClick={onNext}
                    disabled={selectedTimes.length === 0}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {language === 'ko' ? '다음 단계' : 'Next Step'}
                </button>
            </div>
        </motion.div>
    );
};

export default TimeSelection;
