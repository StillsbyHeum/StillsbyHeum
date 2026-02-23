import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const InfoPage: React.FC = () => {
    const { content, language } = useAppContext();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen pt-32 pb-32 w-full px-4"
        >
             <section className="mb-32 max-w-6xl mx-auto">
                <h2 className="text-6xl font-black mb-16 text-center uppercase tracking-tighter font-outfit text-stone-900 dark:text-stone-100">PRODUCTS</h2>
                <div className="flex flex-col gap-6">
                    {content.packages.map((pkg) => (
                        <ProductCard 
                            key={pkg.id} 
                            pkg={pkg} 
                            isOpen={expandedId === pkg.id}
                            onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
                        />
                    ))}
                </div>
             </section>
             
             <section className="max-w-6xl mx-auto px-4 mt-32">
                 <h2 className="text-6xl font-black mb-16 text-center uppercase tracking-tighter font-outfit text-stone-900 dark:text-stone-100">Protocol</h2>
                 <div className="space-y-8">
                     {content.notices.map(n => (
                         <div key={n.id} className="border-l-4 border-stone-200 dark:border-stone-800 pl-6 group">
                             <h4 className="font-black text-xl mb-2 text-stone-900 dark:text-stone-100 group-hover:text-black dark:group-hover:text-white transition-colors">{n.title[language]}</h4>
                             <p className="text-stone-500 dark:text-stone-400 text-xs leading-loose whitespace-pre-line font-bold group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">{n.description[language]}</p>
                         </div>
                     ))}
                 </div>
             </section>
        </motion.div>
    );
};

export default InfoPage;
