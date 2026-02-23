import React, { useState, useRef, useEffect } from 'react';
import { X as CloseIcon, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAI } from '../hooks/useAI';
import SimpleSmile from './SimpleSmile';

const FAQWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { language } = useAppContext();
    const { messages, loading, sendMessage } = useAI();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;
        setInput("");
        await sendMessage(text);
    };

    if (!isOpen) return null;
    return (
        <>
            <div className="fixed inset-0 z-[8999] bg-black/20 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9000] w-[90vw] md:w-[380px] h-[60vh] glass-heavy rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col overflow-hidden animate-ios-open">
                <div className="bg-white/50 backdrop-blur-md p-5 flex justify-between items-center shrink-0 border-b border-white/20">
                    <div className="flex items-center gap-2">
                        <SimpleSmile size={24} className="text-black" />
                        <span className="font-bold text-[11px] tracking-widest uppercase text-stone-800">Heum's AI</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><CloseIcon size={20} className="text-stone-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={scrollRef}>
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-[1.2rem] text-xs leading-relaxed font-medium ${m.role === 'user' ? 'bg-black text-white rounded-tr-none shadow-md' : 'bg-white/80 border border-white/50 text-stone-800 shadow-sm rounded-tl-none'}`}>{m.text}</div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/60 border border-white/40 px-4 py-3 rounded-[1.2rem] rounded-tl-none shadow-sm flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    {!loading && messages.length === 1 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {(language === 'ko' ? ['가격이 궁금해요', '예약은 어떻게 하나요?', '위치는 어디인가요?', '촬영 소요 시간은?'] : ['What are the prices?', 'How to book?', 'Where is the location?', 'How long is the session?']).map((q, i) => (
                                <button key={i} onClick={() => handleSend(q)} className="px-3 py-2 bg-white/50 border border-white/40 rounded-xl text-[10px] font-bold text-stone-600 hover:bg-white hover:scale-105 transition-all shadow-sm">
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-3 bg-white/60 backdrop-blur-md border-t border-white/30 flex gap-2 items-center">
                    <input className="flex-1 bg-white/70 border border-white/50 rounded-full px-5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium placeholder:text-stone-400" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                    <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"><Send size={16} /></button>
                </div>
            </div>
        </>
    );
};

export default FAQWidget;
