import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

interface BookingConfirmationProps {
    formData: {
        name: string;
        email: string;
        phone: string;
        instagram: string;
        people: number;
        message: string;
    };
    selectedDate: Date | null;
    selectedTimes: string[];
    selectedLocations: string[];
    selectedProduct: string | null;
    language: 'ko' | 'en';
    onBack: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
    formData,
    selectedDate,
    selectedTimes,
    selectedLocations,
    selectedProduct,
    language,
    onBack,
    onConfirm,
    isSubmitting
}) => {
    const { content } = useAppContext();
    const pkg = content.packages.find(p => p.id === selectedProduct);
    
    const priceStr = pkg?.price || "";
    const gbpMatch = priceStr.match(/£\s*([0-9,]+)/);
    const krwMatch = priceStr.match(/₩\s*([0-9,]+)/);
    
    const gbpPrice = gbpMatch ? parseInt(gbpMatch[1].replace(/,/g, '')) : 0;
    const krwPrice = krwMatch ? parseInt(krwMatch[1].replace(/,/g, '')) : 0;

    const gbpDeposit = gbpPrice * 0.1;
    const krwDeposit = krwPrice * 0.1;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-black mb-6 text-center uppercase tracking-tighter">{language === 'ko' ? '예약 확인' : 'Confirm Booking'}</h3>
                
                <div className="space-y-6 mb-8">
                    <div className="bg-stone-50 p-6 rounded-2xl space-y-3 border border-stone-100">
                        <div className="flex justify-between text-sm"><span className="text-stone-500 font-bold">{language === 'ko' ? '상품' : 'Package'}</span><span className="font-bold">{pkg?.title[language]}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-stone-500 font-bold">{language === 'ko' ? '날짜' : 'Date'}</span><span className="font-bold">{selectedDate?.toLocaleDateString()}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-stone-500 font-bold">{language === 'ko' ? '시간' : 'Time'}</span><span className="font-bold">{selectedTimes.join(', ')}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-stone-500 font-bold">{language === 'ko' ? '장소' : 'Location'}</span><span className="font-bold text-right">{selectedLocations.join(', ')}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-stone-500 font-bold">{language === 'ko' ? '인원' : 'People'}</span><span className="font-bold">{formData.people} {language === 'ko' ? '명' : 'Person(s)'}</span></div>
                    </div>
                    
                    <div className="border-t border-stone-200 pt-6 space-y-2">
                        <div className="flex justify-between items-center text-stone-500 font-bold text-sm">
                            <span>{language === 'ko' ? '총 금액' : 'Total Price'}</span>
                            <span>{pkg?.price}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-black">
                            <span>{language === 'ko' ? '예약금 (10%)' : 'Deposit (10%)'}</span>
                            <span className="text-blue-600">
                                {gbpDeposit > 0 && `£${gbpDeposit.toLocaleString()}`}
                                {krwDeposit > 0 && gbpDeposit > 0 && ' / '}
                                {krwDeposit > 0 && `₩${krwDeposit.toLocaleString()}`}
                            </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-2 text-right font-medium">
                            {language === 'ko' ? '* 예약금 입금 후 예약이 확정됩니다.' : '* Booking is confirmed after deposit payment.'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onBack} className="flex-1 py-4 bg-stone-100 rounded-xl font-bold text-stone-600 hover:bg-stone-200 transition-colors">
                        {language === 'ko' ? '수정하기' : 'Edit'}
                    </button>
                    <button onClick={onConfirm} disabled={isSubmitting} className="flex-1 py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-wait">
                        {isSubmitting ? (language === 'ko' ? '처리중...' : 'Processing...') : (language === 'ko' ? '예약 확정하기' : 'Confirm & Pay')}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default BookingConfirmation;
