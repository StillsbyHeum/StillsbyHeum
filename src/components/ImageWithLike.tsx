import React from 'react';
import { Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ImageWithLikeProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
    className?: string;
}

const ImageWithLike: React.FC<ImageWithLikeProps> = ({ src, alt, className, ...props }) => {
    const { likedPhotos, toggleLike } = useAppContext();
    const isLiked = likedPhotos.includes(src);
    const [hasError, setHasError] = React.useState(false);

    if (hasError) return null;

    return (
        <div className={`relative group overflow-hidden ${className}`}>
            <img 
                src={src} 
                alt={alt || "Portfolio photograph by Heum"} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                onError={() => setHasError(true)}
                {...props} 
            />
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(src);
                }}
                aria-label={isLiked ? "Unlike photo" : "Like photo"}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 z-10 ${
                    isLiked 
                        ? 'bg-red-500 text-white opacity-100 scale-100' 
                        : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50 scale-90 group-hover:scale-100'
                }`}
            >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            </button>
        </div>
    );
};

export default ImageWithLike;
