import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

interface ProductSelectionProps {
    selectedProduct: string | null;
    language: 'ko' | 'en';
    onBack: () => void;
    onProductSelect: (id: string) => void;
}

const ProductSelection: React.FC<ProductSelectionProps> = ({
    selectedProduct,
    language,
    onBack,
    onProductSelect
}) => {
    const { content } = useAppContext();

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-1 h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft size={16}/></button>
                <h3 className="text-xl font-bold">{language === 'ko' ? '상품 선택' : 'Select Product'}</h3>
            </div>
            <div className="space-y-3">
                {content.packages.map(pkg => (
                    <button 
                        key={pkg.id} 
                        onClick={() => onProductSelect(pkg.id)}
                        className={`w-full py-4 px-6 text-left border rounded-2xl text-sm font-bold transition-all shadow-sm flex justify-between items-center ${
                            selectedProduct === pkg.id 
                            ? 'bg-black text-white border-black scale-[1.02]' 
                            : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700'
                        }`}
                    >
                        <span>{pkg.title[language]}</span>
                        {selectedProduct === pkg.id && <Check size={16} />}
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default ProductSelection;
