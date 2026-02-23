import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface DateSelectionProps {
    currentMonth: Date;
    selectedDate: Date | null;
    language: 'ko' | 'en';
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onDateSelect: (day: number) => void;
}

const DateSelection: React.FC<DateSelectionProps> = ({
    currentMonth,
    selectedDate,
    language,
    onPrevMonth,
    onNextMonth,
    onDateSelect
}) => {
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
    const blanks = Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => i);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-stone-100 h-fit">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{currentMonth.toLocaleString(language === 'ko' ? 'ko-KR' : 'default', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-2">
                        <button onClick={onPrevMonth} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                        <button onClick={onNextMonth} className="p-2 hover:bg-stone-100 rounded-full transition-colors rotate-180"><ChevronLeft size={20}/></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {(language === 'ko' ? ['일', '월', '화', '수', '목', '금', '토'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => <div key={d} className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {blanks.map((b, i) => <div key={`blank-${i}`} />)}
                    {days.map(d => {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = date < today;
                        
                        return (
                            <button
                                key={d}
                                onClick={() => !isPast && onDateSelect(d)}
                                disabled={isPast}
                                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    selectedDate?.getDate() === d && selectedDate?.getMonth() === currentMonth.getMonth()
                                        ? 'bg-black text-white shadow-md scale-110'
                                        : isPast 
                                            ? 'text-stone-300 cursor-not-allowed' 
                                            : 'hover:bg-stone-100 text-stone-700'
                                }`}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 min-h-[400px] flex flex-col relative overflow-hidden items-center justify-center text-stone-400 gap-4">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center">
                        <CalendarIcon size={32} className="text-stone-400" />
                    </div>
                    <p className="font-bold text-sm">{language === 'ko' ? '날짜를 선택해주세요' : 'Select a date to begin'}</p>
                </motion.div>
            </div>
        </div>
    );
};

export default DateSelection;
