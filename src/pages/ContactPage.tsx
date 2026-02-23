import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import DateSelection from '../components/contact/DateSelection';
import TimeSelection from '../components/contact/TimeSelection';
import LocationSelection from '../components/contact/LocationSelection';
import ProductSelection from '../components/contact/ProductSelection';
import DetailsForm from '../components/contact/DetailsForm';
import BookingConfirmation from '../components/contact/BookingConfirmation';
import LikedPhotos from '../components/contact/LikedPhotos';

const ContactPage: React.FC = () => {
    const { language, likedPhotos } = useAppContext();
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', instagram: '', people: 1, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        setSelectedDate(newDate);
        setStep(2);
    };

    const handleTimeSelect = (time: string) => {
        if (selectedTimes.includes(time)) {
            setSelectedTimes(selectedTimes.filter(t => t !== time));
        } else {
            setSelectedTimes([...selectedTimes, time].sort());
        }
    };

    const handleLocationSelect = (loc: string) => {
        if (selectedLocations.includes(loc)) {
            setSelectedLocations(selectedLocations.filter(l => l !== loc));
        } else {
            setSelectedLocations([...selectedLocations, loc]);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        const { content } = useAppContext();
        const pkg = content.packages.find(p => p.id === selectedProduct);
        const priceStr = pkg?.price || "";
        const gbpMatch = priceStr.match(/£\s*([0-9,]+)/);
        const krwMatch = priceStr.match(/₩\s*([0-9,]+)/);
        const gbpPrice = gbpMatch ? parseInt(gbpMatch[1].replace(/,/g, '')) : 0;
        const krwPrice = krwMatch ? parseInt(krwMatch[1].replace(/,/g, '')) : 0;
        const gbpDeposit = gbpPrice * 0.1;
        const krwDeposit = krwPrice * 0.1;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://formspree.io/f/xzzzdnqk'; // Replace with actual ID
        
        const data = {
            ...formData,
            date: selectedDate?.toLocaleDateString(),
            times: selectedTimes.join(', '),
            locations: selectedLocations.join(', '),
            product: selectedProduct,
            language,
            likedPhotos: likedPhotos.join('\n')
        };

        Object.entries(data).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen pt-32 px-4 pb-32 max-w-7xl mx-auto">
            <div className="mb-12">
                <h2 className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter">
                    {language === 'ko' ? '예약하기' : 'Booking'}
                </h2>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-black' : 'bg-stone-200'}`} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
                <div className="lg:col-span-2 h-full">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <DateSelection 
                                key="date"
                                currentMonth={currentMonth}
                                selectedDate={selectedDate}
                                language={language}
                                onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                                onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                                onDateSelect={handleDateSelect}
                            />
                        )}
                        {step === 2 && (
                            <TimeSelection 
                                key="time"
                                selectedDate={selectedDate!}
                                selectedTimes={selectedTimes}
                                language={language}
                                onBack={() => setStep(1)}
                                onTimeSelect={handleTimeSelect}
                                onNext={() => setStep(3)}
                            />
                        )}
                        {step === 3 && (
                            <LocationSelection 
                                key="location"
                                selectedLocations={selectedLocations}
                                language={language}
                                onBack={() => setStep(2)}
                                onLocationSelect={handleLocationSelect}
                                onNext={() => setStep(4)}
                            />
                        )}
                        {step === 4 && (
                            <ProductSelection 
                                key="product"
                                selectedProduct={selectedProduct}
                                language={language}
                                onBack={() => setStep(3)}
                                onProductSelect={(id) => { setSelectedProduct(id); setStep(5); }}
                            />
                        )}
                        {step === 5 && (
                            <LikedPhotos 
                                key="liked"
                                language={language}
                                onBack={() => setStep(4)}
                                onNext={() => setStep(6)}
                            />
                        )}
                        {step === 6 && (
                            <DetailsForm 
                                key="details"
                                formData={formData}
                                language={language}
                                onBack={() => setStep(5)}
                                onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                                onSubmit={() => setShowConfirmation(true)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="hidden lg:block bg-stone-50 dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 h-fit sticky top-32">
                    <h3 className="font-bold text-xl mb-6 text-stone-900 dark:text-stone-100">{language === 'ko' ? '예약 요약' : 'Summary'}</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="text-stone-500 dark:text-stone-400">{language === 'ko' ? '날짜' : 'Date'}</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{selectedDate?.toLocaleDateString() || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="text-stone-500 dark:text-stone-400">{language === 'ko' ? '시간' : 'Time'}</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{selectedTimes.length > 0 ? selectedTimes.join(', ') : '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="text-stone-500 dark:text-stone-400">{language === 'ko' ? '장소' : 'Location'}</span>
                            <span className="font-bold text-right max-w-[150px] text-stone-900 dark:text-stone-100">{selectedLocations.length > 0 ? selectedLocations.join(', ') : '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="text-stone-500 dark:text-stone-400">{language === 'ko' ? '상품' : 'Package'}</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{selectedProduct || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                            <span className="text-stone-500 dark:text-stone-400">{language === 'ko' ? '좋아요' : 'Liked'}</span>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{likedPhotos.length} {language === 'ko' ? '장' : 'Photos'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {showConfirmation && (
                <BookingConfirmation 
                    formData={formData}
                    selectedDate={selectedDate}
                    selectedTimes={selectedTimes}
                    selectedLocations={selectedLocations}
                    selectedProduct={selectedProduct}
                    language={language}
                    onBack={() => setShowConfirmation(false)}
                    onConfirm={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
};

export default ContactPage;
