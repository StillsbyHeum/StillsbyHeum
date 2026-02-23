import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Upload } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ContentData } from '../../types';

interface EditableTextProps {
    section?: keyof ContentData; // Optional if onSave is provided
    field?: string;
    value: string;
    className?: string;
    multiline?: boolean;
    as?: any; // Allow any component type
    onSave?: (value: string) => void;
}

export const EditableText: React.FC<EditableTextProps> = ({ 
    section, 
    field = '', 
    value, 
    className = '', 
    multiline = false,
    as: Component = 'div',
    onSave
}) => {
    const { isEditMode, updateContent } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    const handleSave = () => {
        if (onSave) {
            onSave(tempValue);
        } else if (section) {
            updateContent(section, field, tempValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    if (!isEditMode) {
        return <Component className={className}>{value}</Component>;
    }

    if (isEditing) {
        return (
            <div className="relative inline-block w-full">
                {multiline ? (
                    <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className={`w-full p-2 border-2 border-blue-500 rounded bg-white text-black min-h-[100px] ${className}`}
                        autoFocus
                    />
                ) : (
                    <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className={`w-full p-1 border-2 border-blue-500 rounded bg-white text-black ${className}`}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                    />
                )}
                <div className="absolute -top-8 right-0 flex gap-1 z-50 bg-white shadow-lg rounded p-1">
                    <button onClick={handleSave} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                        <Check size={16} />
                    </button>
                    <button onClick={handleCancel} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group inline-block">
            <Component className={`${className} border border-transparent hover:border-blue-500 hover:bg-blue-50/10 rounded cursor-text transition-all`}>
                {value}
            </Component>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="absolute -top-3 -right-3 p-1.5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
            >
                <Edit2 size={12} />
            </button>
        </div>
    );
};

interface EditableImageProps {
    section: keyof ContentData;
    field?: string;
    src: string;
    alt?: string;
    className?: string;
    aspectRatio?: string; // e.g. "aspect-[3/4]"
}

export const EditableImage: React.FC<EditableImageProps> = ({
    section,
    field = '',
    src,
    alt = '',
    className = '',
    aspectRatio
}) => {
    const { isEditMode, updateContent } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    updateContent(section, field, reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isEditMode) {
        return <img src={src} alt={alt} className={className} />;
    }

    return (
        <div className={`relative group ${aspectRatio || ''} ${className}`}>
            <img src={src} alt={alt} className={`w-full h-full object-cover ${isEditMode ? 'group-hover:opacity-70 transition-opacity' : ''}`} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                    <Upload size={20} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                Edit Image
            </div>
        </div>
    );
};
