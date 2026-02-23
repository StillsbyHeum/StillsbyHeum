import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Plus, Minus } from 'lucide-react';

const FAQPage: React.FC = () => {
    const { content, language } = useAppContext();

    return (
        <div className="min-h-screen pt-32 px-4 pb-32 max-w-4xl mx-auto">
            <h2 className="text-6xl md:text-8xl font-black mb-12 uppercase tracking-tighter text-center">FAQ</h2>
            <div className="space-y-4">
                {content.faqs.map((faq, idx) => (
                    <FAQItem key={faq.id} faq={faq} language={language} idx={idx} />
                ))}
            </div>
        </div>
    );
};

const FAQItem: React.FC<{ faq: any; language: 'ko' | 'en'; idx: number }> = ({ faq, language, idx }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border-b border-stone-200 dark:border-stone-800">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors px-4 rounded-xl"
            >
                <span className="font-bold text-lg md:text-xl pr-8">
                    <span className="text-stone-400 mr-4 font-mono text-sm">0{idx + 1}</span>
                    {faq.q[language]}
                </span>
                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                    <Plus size={20} />
                </span>
            </button>
            <motion.div 
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <p className="pb-8 pt-2 px-4 text-stone-600 dark:text-stone-400 leading-relaxed pl-12">
                    {faq.a[language]}
                </p>
            </motion.div>
        </div>
    );
};

export default FAQPage;
