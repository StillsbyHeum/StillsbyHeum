import React, { useState, useEffect } from 'react';

const LondonTime: React.FC = () => {
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const londonTime = now.toLocaleTimeString('en-GB', {
                timeZone: 'Europe/London',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            setTime(londonTime);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-editorial-micro opacity-70">
            LONDON {time}
        </div>
    );
};

export default LondonTime;
