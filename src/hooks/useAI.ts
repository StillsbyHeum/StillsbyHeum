import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateResponse } from '../services/geminiService';

export const useAI = () => {
    const { content, language, logAIInteraction } = useAppContext();
    const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
        { role: 'bot', text: language === 'ko' ? "안녕하세요! 흠작가님의 AI 매니저입니다. 궁금하신 점을 물어보세요." : "Hello! I'm Heum's AI Manager. How can I help you today?" }
    ]);
    const [loading, setLoading] = useState(false);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;
        
        setMessages(prev => [...prev, { role: 'user', text }]);
        setLoading(true);
        
        try {
            const response = await generateResponse(text, content.aiContext, content);
            setMessages(prev => [...prev, { role: 'bot', text: response }]);
            logAIInteraction(text, response); 
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'bot', text: language === 'ko' ? "죄송합니다. 오류가 발생했습니다." : "Sorry, an error occurred." }]);
        } finally {
            setLoading(false);
        }
    }, [content, language, loading, logAIInteraction]);

    return { messages, loading, sendMessage };
};
