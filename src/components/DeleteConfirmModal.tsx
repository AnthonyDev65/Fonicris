import { AlertTriangle, X, Loader2 } from 'lucide-react';
import type { Activo } from '../types';

interface DeleteConfirmModalProps {
    asset: Activo;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function DeleteConfirmModal({ 
    asset, 
    onConfirm, 
    onCancel, 
    isLoading = false 
}: DeleteConfirmModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Confirmar Eliminación
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        ¿Estás seguro de que deseas eliminar este activo? Esta acción moverá el activo al historial.
                    </p>

                    {/* Asset Info Card */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-4">
                            {asset.ImagenUrl ? (
                                <img 
                                    src={asset.ImagenUrl} 
                                    alt={asset.Nombre}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-2xl text-gray-400">📦</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {asset.Nombre}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Código: <span className="font-mono">{asset.CodigoId}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`
                                        px-2 py-0.5 rounded text-xs font-medium
                                        ${asset.Estado === 'Nuevo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                        ${asset.Estado === 'Usado' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                                        ${asset.Estado === 'Dañado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                    `}>
                                        {asset.Estado}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Cant: {asset.Cantidad}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        <strong>Nota:</strong> El activo será movido al historial y podrá ser consultado posteriormente.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            'Eliminar Activo'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
