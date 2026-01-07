import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useState } from 'react';

interface ImageLightboxProps {
    imageUrl: string;
    onClose: () => void;
}

export default function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'asset-image.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <img
                    src={imageUrl}
                    alt="Asset"
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
