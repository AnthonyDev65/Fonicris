import { X, ZoomIn, ZoomOut, Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ImageLightboxProps {
    imageUrl: string;
    onClose: () => void;
}

/**
 * Converts Google Drive URLs to a format that works in browsers
 */
function getDirectImageUrl(url: string): string {
    // If it's already a direct URL, return as is
    if (!url.includes('drive.google.com')) {
        return url;
    }

    // Extract file ID from various Google Drive URL formats
    let fileId: string | null = null;

    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (ucMatch) {
        fileId = ucMatch[1];
    }

    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        fileId = fileMatch[1];
    }

    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
        fileId = openMatch[1];
    }

    if (fileId) {
        // Use lh3.googleusercontent.com which works better for direct image access
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return url;
}

export default function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        setCurrentUrl(getDirectImageUrl(imageUrl));
    }, [imageUrl]);

    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

    const handleDownload = () => {
        window.open(imageUrl, '_blank');
    };

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        // Try alternative URL format if first one fails
        if (currentUrl.includes('lh3.googleusercontent.com')) {
            // Try the thumbnail format as fallback
            const fileId = currentUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (fileId) {
                setCurrentUrl(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`);
                setIsLoading(true);
                return;
            }
        }
        setHasError(true);
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={onClose}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleZoomOut();
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Alejar"
                    >
                        <ZoomOut className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white/60 text-sm min-w-[50px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleZoomIn();
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Acercar"
                    >
                        <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Descargar"
                    >
                        <Download className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Image */}
            <div
                className="flex-1 flex items-center justify-center overflow-auto p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                )}
                
                {hasError ? (
                    <div className="text-center text-white">
                        <p className="text-lg mb-4">No se pudo cargar la imagen</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(imageUrl, '_blank');
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Abrir en nueva pestaña
                        </button>
                    </div>
                ) : (
                    <img
                        src={currentUrl}
                        alt="Asset"
                        className={`max-w-full max-h-full object-contain transition-transform duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transform: `scale(${zoom})` }}
                        onClick={(e) => e.stopPropagation()}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                    />
                )}
            </div>
        </div>
    );
}
