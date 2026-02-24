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
    
    return (
        <motion.div 
            layout
            onClick={onClick}
            className="w-full border-t border-black/10 dark:border-white/10 pt-8 pb-4 cursor-pointer group"
        >
            <motion.div layout className="flex justify-between items-start">
                <h3 className="text-editorial-h2 group-hover:opacity-50 transition-opacity">
                    {pkg.title[language]}
                </h3>
                <motion.div 
                    layout
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2"
                >
                    <ChevronRight size={24} className="opacity-50" />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                         <p className="text-editorial-h3 mb-8">{pkg.price}</p>
                         <ul className="space-y-4">
                            {pkg.features[language].map((f: string, i: number) => ( 
                                <li key={i} className="flex gap-4 items-start text-editorial-body">
                                    <span className="opacity-50">NO. {String(i + 1).padStart(2, '0')}</span>
                                    <span>{f}</span>
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
