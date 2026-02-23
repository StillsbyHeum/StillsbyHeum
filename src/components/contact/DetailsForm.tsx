import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface DetailsFormProps {
    formData: {
        name: string;
        email: string;
        phone: string;
        instagram: string;
        people: number;
        message: string;
    };
    language: 'ko' | 'en';
    onBack: () => void;
    onChange: (field: string, value: string | number) => void;
    onSubmit: () => void;
}

const DetailsForm: React.FC<DetailsFormProps> = ({
    formData,
    language,
    onBack,
    onChange,
    onSubmit
}) => {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                <h3 className="text-xl font-bold">{language === 'ko' ? '상세 정보' : 'Your Details'}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input className="p-4 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all" placeholder={language === 'ko' ? "이름" : "Name"} value={formData.name} onChange={e => onChange('name', e.target.value)} />
                <input className="p-4 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all" placeholder={language === 'ko' ? "이메일" : "Email"} type="email" value={formData.email} onChange={e => onChange('email', e.target.value)} />
                <input className="p-4 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all" placeholder={language === 'ko' ? "연락처" : "Phone"} type="tel" value={formData.phone} onChange={e => onChange('phone', e.target.value)} />
                <input className="p-4 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all" placeholder={language === 'ko' ? "인스타그램 ID" : "Instagram ID"} value={formData.instagram} onChange={e => onChange('instagram', e.target.value)} />
                <div className="col-span-2 flex items-center gap-4 p-4 border border-stone-200 rounded-xl">
                    <span className="text-stone-500 font-bold text-sm flex-1">{language === 'ko' ? "촬영 인원" : "Number of People"}</span>
                    <button onClick={() => onChange('people', Math.max(1, formData.people - 1))} className="w-8 h-8 rounded-full bg-stone-100 font-bold hover:bg-stone-200">-</button>
                    <span className="font-bold w-8 text-center">{formData.people}</span>
                    <button onClick={() => onChange('people', formData.people + 1)} className="w-8 h-8 rounded-full bg-stone-100 font-bold hover:bg-stone-200">+</button>
                </div>
                <textarea className="col-span-2 p-4 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all h-32 resize-none" placeholder={language === 'ko' ? "추가 요청사항이나 궁금한 점을 적어주세요." : "Any special requests or questions?"} value={formData.message} onChange={e => onChange('message', e.target.value)} />
            </div>
            <div className="mt-auto pt-6 border-t border-stone-200">
                <button 
                    onClick={onSubmit}
                    disabled={!formData.name || !formData.email}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {language === 'ko' ? '예약 확인' : 'Review Booking'}
                </button>
            </div>
        </motion.div>
    );
};

export default DetailsForm;
