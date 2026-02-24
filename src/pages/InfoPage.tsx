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
            className="min-h-screen pt-40 pb-32 w-full px-6 max-w-[1800px] mx-auto"
        >
             <section className="mb-40">
                <h2 className="text-huge mb-20">PRODUCTS</h2>
                <div className="flex flex-col gap-8 md:gap-16">
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
             
             <section className="mt-40">
                 <h2 className="text-editorial-h1 mb-20">PROTOCOL</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                     {content.notices.map(n => (
                         <div key={n.id} className="border-t border-black/10 dark:border-white/10 pt-6">
                             <h4 className="text-editorial-h3 mb-4">{n.title[language]}</h4>
                             <p className="text-editorial-body text-black/70 dark:text-white/70 whitespace-pre-line">{n.description[language]}</p>
                         </div>
                     ))}
                 </div>
             </section>
        </motion.div>
    );
};

export default InfoPage;
