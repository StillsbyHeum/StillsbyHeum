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
        try {
            const data = {
                ...formData,
                date: selectedDate?.toLocaleDateString(),
                times: selectedTimes.join(', '),
                locations: selectedLocations.join(', '),
                product: selectedProduct,
                language,
                likedPhotos: likedPhotos.join('\n')
            };

            const response = await fetch('https://formspree.io/f/xzzzdnqk', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert(language === 'ko' ? '예약이 성공적으로 접수되었습니다!' : 'Booking successfully submitted!');
            } else {
                alert(language === 'ko' ? '예약 접수 중 오류가 발생했습니다.' : 'Error submitting booking.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert(language === 'ko' ? '예약 접수 중 오류가 발생했습니다.' : 'Error submitting booking.');
        }

        setIsSubmitting(false);
        setShowConfirmation(false);
        setStep(1);
    };

    return (
        <div className="min-h-screen pt-40 px-6 pb-32 max-w-[1800px] mx-auto font-sans">
            <div className="mb-32">
                <h2 className="text-huge mb-16">
                    {language === 'ko' ? 'BOOKING' : 'BOOKING'}
                </h2>
                <div className="flex gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={`h-px flex-1 transition-all duration-500 ${i <= step ? 'bg-black dark:bg-white' : 'bg-black/10 dark:bg-white/10'}`} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 min-h-[600px]">
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

                <div className="hidden lg:block border border-black/10 dark:border-white/10 p-8 h-fit sticky top-32">
                    <h3 className="text-editorial-h3 mb-12">{language === 'ko' ? 'SUMMARY' : 'SUMMARY'}</h3>
                    <div className="space-y-6 text-editorial-body">
                        <div className="flex justify-between border-b border-black/10 dark:border-white/10 pb-4">
                            <span className="text-black/50 dark:text-white/50">{language === 'ko' ? 'DATE' : 'DATE'}</span>
                            <span className="text-right">{selectedDate?.toLocaleDateString() || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-white/10 pb-4">
                            <span className="text-black/50 dark:text-white/50">{language === 'ko' ? 'TIME' : 'TIME'}</span>
                            <span className="text-right">{selectedTimes.length > 0 ? selectedTimes.join(', ') : '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-white/10 pb-4">
                            <span className="text-black/50 dark:text-white/50">{language === 'ko' ? 'LOCATION' : 'LOCATION'}</span>
                            <span className="text-right max-w-[150px]">{selectedLocations.length > 0 ? selectedLocations.join(', ') : '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-white/10 pb-4">
                            <span className="text-black/50 dark:text-white/50">{language === 'ko' ? 'PACKAGE' : 'PACKAGE'}</span>
                            <span className="text-right">{selectedProduct || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-white/10 pb-4">
                            <span className="text-black/50 dark:text-white/50">{language === 'ko' ? 'LIKED' : 'LIKED'}</span>
                            <span className="text-right">{likedPhotos.length} {language === 'ko' ? 'PHOTOS' : 'PHOTOS'}</span>
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
