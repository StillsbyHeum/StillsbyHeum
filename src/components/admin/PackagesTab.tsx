import React from 'react';
import { useAppContext } from '../../context/AppContext';

const PackagesTab: React.FC = () => {
    const { content, updateContent } = useAppContext();

    return (
        <div className="space-y-8">
            {content.packages.map((pkg, idx) => (
                <div key={pkg.id} className="border border-stone-200 p-6 rounded-2xl relative">
                    <h4 className="font-bold mb-4">Package {idx + 1}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input className="p-3 border rounded-xl" value={pkg.title.en} onChange={e => {
                            const newPkgs = [...content.packages];
                            newPkgs[idx].title.en = e.target.value;
                            updateContent('packages', '', newPkgs);
                        }} placeholder="Title (EN)" />
                        <input className="p-3 border rounded-xl" value={pkg.title.ko} onChange={e => {
                            const newPkgs = [...content.packages];
                            newPkgs[idx].title.ko = e.target.value;
                            updateContent('packages', '', newPkgs);
                        }} placeholder="Title (KO)" />
                    </div>
                    <input className="w-full p-3 border rounded-xl mb-4" value={pkg.price} onChange={e => {
                        const newPkgs = [...content.packages];
                        newPkgs[idx].price = e.target.value;
                        updateContent('packages', '', newPkgs);
                    }} placeholder="Price" />
                    <div className="grid grid-cols-2 gap-4">
                        <textarea className="p-3 border rounded-xl h-32" value={pkg.features.en.join('\n')} onChange={e => {
                            const newPkgs = [...content.packages];
                            newPkgs[idx].features.en = e.target.value.split('\n');
                            updateContent('packages', '', newPkgs);
                        }} placeholder="Features (EN) - One per line" />
                        <textarea className="p-3 border rounded-xl h-32" value={pkg.features.ko.join('\n')} onChange={e => {
                            const newPkgs = [...content.packages];
                            newPkgs[idx].features.ko = e.target.value.split('\n');
                            updateContent('packages', '', newPkgs);
                        }} placeholder="Features (KO) - One per line" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PackagesTab;
