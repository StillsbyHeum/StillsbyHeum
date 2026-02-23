import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ProductCard: React.FC<{ 
    pkg: any, 
    isOpen: boolean,
    onClick: () => void
}> = ({ pkg, isOpen, onClick }) => {
    const { language } = useAppContext();
    const isDark = pkg.color.includes('bg-black') || pkg.color.includes('bg-stone-900');
    const textColor = isDark ? 'text-white' : 'text-stone-900';
    const subTextColor = isDark ? 'text-stone-400' : 'text-stone-500';
    const checkColor = isDark ? 'text-white' : 'text-stone-900';
    
    return (
        <motion.div 
            layout
            onClick={onClick}
            className={`w-full max-w-3xl mx-auto rounded-[2rem] p-6 md:p-8 cursor-pointer overflow-hidden ${pkg.color} border border-stone-200 shadow-lg hover:shadow-xl transition-shadow`}
            initial={{ borderRadius: "2rem" }}
        >
            <motion.div layout className="flex justify-between items-center">
                <h3 className={`text-xl md:text-3xl font-black uppercase tracking-tighter leading-tight font-outfit ${textColor}`}>
                    {pkg.title[language]}
                </h3>
                <motion.div 
                    layout
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronRight size={28} className={`${textColor} stroke-[3px]`} />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                         <p className={`text-lg md:text-xl opacity-80 mb-6 font-bold tracking-wide ${textColor}`}>{pkg.price}</p>
                         <ul className="space-y-3 text-sm md:text-base opacity-90">
                            {pkg.features[language].map((f: string, i: number) => ( 
                                <li key={i} className="flex gap-3 items-start">
                                    <Check size={18} className={`mt-1 shrink-0 stroke-[3px] ${checkColor}`}/> 
                                    <span className={`font-bold leading-relaxed ${textColor}`}>{f}</span>
                                </li> 
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ProductCard;
