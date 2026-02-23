import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-black rounded-full animate-spin" />
        </div>
    );
};

export default LoadingSpinner;
