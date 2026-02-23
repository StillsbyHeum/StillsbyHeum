import React, { useState } from 'react';
import { Plus, Trash2, Save, X as CloseIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Review } from '../../types';

const ReviewsTab: React.FC = () => {
    const { reviews, updateReviews } = useAppContext();
    const [editingReview, setEditingReview] = useState<Review | null>(null);

    const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (urls: string[]) => void) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls: string[] = [];
            let processed = 0;
            files.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    urls.push(reader.result as string);
                    processed++;
                    if (processed === files.length) callback(urls);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl">Manage Reviews</h3>
                <button onClick={() => setEditingReview({ id: Date.now().toString(), author: '', content: '', rating: 5, date: new Date().toISOString().split('T')[0], photos: [], email: '' })} className="px-4 py-2 bg-black text-white rounded-xl font-bold text-xs flex items-center gap-2">
                    <Plus size={14} /> Add Review
                </button>
            </div>

            {editingReview && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-xl mb-6">{editingReview.author ? 'Edit Review' : 'New Review'}</h3>
                        <div className="space-y-4">
                            <input className="w-full p-3 border rounded-xl" placeholder="Author" value={editingReview.author} onChange={e => setEditingReview({...editingReview, author: e.target.value})} />
                            <textarea className="w-full p-3 border rounded-xl h-32" placeholder="Content" value={editingReview.content} onChange={e => setEditingReview({...editingReview, content: e.target.value})} />
                            <div className="flex items-center gap-4">
                                <label className="text-xs font-bold">Rating</label>
                                <input type="number" min="1" max="5" className="p-2 border rounded-lg w-20" value={editingReview.rating} onChange={e => setEditingReview({...editingReview, rating: parseInt(e.target.value)})} />
                            </div>
                            <input type="date" className="w-full p-3 border rounded-xl" value={editingReview.date} onChange={e => setEditingReview({...editingReview, date: e.target.value})} />
                            
                            <div>
                                <label className="text-xs font-bold block mb-2">Photos</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editingReview.photos?.map((p, i) => (
                                        <div key={i} className="relative w-16 h-16">
                                            <img src={p} className="w-full h-full object-cover rounded-lg" alt="Review" />
                                            <button onClick={() => setEditingReview({...editingReview, photos: editingReview.photos?.filter((_, idx) => idx !== i)})} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full"><CloseIcon size={10} /></button>
                                        </div>
                                    ))}
                                    <label className="w-16 h-16 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-stone-50">
                                        <Plus size={20} className="text-stone-400" />
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleMultipleFileUpload(e, (urls) => setEditingReview({...editingReview, photos: [...(editingReview.photos || []), ...urls]}))} />
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <button onClick={() => setEditingReview(null)} className="flex-1 py-3 bg-stone-100 rounded-xl font-bold">Cancel</button>
                                <button onClick={() => {
                                    if (reviews.find(r => r.id === editingReview.id)) {
                                        updateReviews(reviews.map(r => r.id === editingReview.id ? editingReview : r));
                                    } else {
                                        updateReviews([editingReview, ...reviews]);
                                    }
                                    setEditingReview(null);
                                }} className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {reviews.map(r => (
                    <div key={r.id} className="border border-stone-200 p-4 rounded-xl flex justify-between items-start">
                        <div>
                            <h4 className="font-bold">{r.author} <span className="text-stone-400 text-xs font-normal ml-2">{r.date}</span></h4>
                            <p className="text-sm text-stone-600 line-clamp-2 mt-1">{r.content}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingReview(r)} className="p-2 hover:bg-stone-100 rounded-lg"><Save size={16} /></button>
                            <button onClick={() => updateReviews(reviews.filter(item => item.id !== r.id))} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsTab;
