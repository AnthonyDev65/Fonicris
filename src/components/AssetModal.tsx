import { useState, useRef, useEffect } from 'react';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { googleDriveService } from '../services/GoogleDriveService';
import { useAuthStore } from '../store/useAuthStore';
import type { Activo } from '../types';
import {
    X,
    Loader2,
    Upload,
    Image as ImageIcon,
    QrCode,
    Printer,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AssetModalProps {
    asset: Activo | null;
    onClose: () => void;
    onSave: () => void;
}

const ESTADOS = ['Nuevo', 'Usado', 'Dañado'];
const GRUPOS = ['ORFANATO NIÑOS DE CRISTO', 'ORFANATO NIÑAS DE CRISTO'];

const ZONAS_POR_GRUPO: Record<string, string[]> = {
    'ORFANATO NIÑOS DE CRISTO': [
        'Almacén General',
        'Cocina',
        'Comedor',
        'Dormitorios',
        'Oficina',
        'Sala de Juegos',
        'Baños',
        'Lavandería',
        'Patio',
    ],
    'ORFANATO NIÑAS DE CRISTO': [
        'Almacén General',
        'Cocina',
        'Comedor',
        'Dormitorios',
        'Oficina',
        'Sala de Actividades',
        'Baños',
        'Lavandería',
        'Jardín',
    ],
};

const initialFormState: Omit<Activo, 'Numero'> = {
    CodigoId: '',
    Nombre: '',
    Marca: '',
    Cantidad: 1,
    Estado: 'Nuevo',
    Responsable: '',
    FechaIngreso: new Date().toISOString().split('T')[0],
    Grupo: GRUPOS[0],
    Zona: '',
    Observaciones: '',
    Valoracion: 0,
    ImagenUrl: '',
};

export default function AssetModal({ asset, onClose, onSave }: AssetModalProps) {
    const { user } = useAuthStore();
    const [form, setForm] = useState<Omit<Activo, 'Numero'>>(() =>
        asset ? { ...asset } : { ...initialFormState }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'exists' | 'available' | 'error'>('idle');
    const [showQR, setShowQR] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const isEdit = asset !== null;
    const availableZonas = ZONAS_POR_GRUPO[form.Grupo] || [];

    // Update zona when grupo changes
    useEffect(() => {
        if (!isEdit && form.Grupo) {
            const zonas = ZONAS_POR_GRUPO[form.Grupo] || [];
            if (zonas.length > 0 && !zonas.includes(form.Zona)) {
                setForm(prev => ({ ...prev, Zona: zonas[0] }));
            }
        }
    }, [form.Grupo, isEdit]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));

        // Reset verification when codigo changes
        if (name === 'CodigoId') {
            setVerificationStatus('idle');
        }
    };

    const handleVerifyCode = async () => {
        if (!form.CodigoId.trim()) {
            setError('Por favor ingresa un código.');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const exists = await googleSheetsService.checkCodigoExists(form.CodigoId);
            if (exists) {
                setVerificationStatus('exists');
                setError('Este código ya existe en el sistema.');
            } else {
                setVerificationStatus('available');
            }
        } catch (err) {
            setVerificationStatus('error');
            setError('Error al verificar el código.');
            console.error(err);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const url = await googleDriveService.uploadImage(file);
            setForm((prev) => ({ ...prev, ImagenUrl: url }));
        } catch (err) {
            setError('Error al subir la imagen');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClearImage = () => {
        setForm((prev) => ({ ...prev, ImagenUrl: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!form.CodigoId.trim()) {
            setError('El código es requerido');
            return;
        }
        if (!form.Nombre.trim()) {
            setError('El nombre es requerido');
            return;
        }

        // For new assets, verify code doesn't exist
        if (!isEdit && verificationStatus !== 'available') {
            setError('Por favor verifica el código antes de guardar');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const userName = user?.Nombre || user?.Email || 'Usuario';
            
            if (isEdit && asset) {
                await googleSheetsService.updateActivo({ ...form, Numero: asset.Numero });
                // Log edit activity
                await googleSheetsService.addActivityLog(
                    userName,
                    'EDITAR',
                    `Activo editado: ${form.CodigoId} - ${form.Nombre}`
                );
            } else {
                await googleSheetsService.addActivo(form);
                // Log create activity
                await googleSheetsService.addActivityLog(
                    userName,
                    'CREAR',
                    `Activo creado: ${form.CodigoId} - ${form.Nombre}`
                );
            }
            onSave();
        } catch (err) {
            setError(isEdit ? 'Error al actualizar el activo' : 'Error al crear el activo');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow || !qrRef.current) return;

        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Etiqueta - ${form.CodigoId}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            font-family: system-ui, sans-serif;
                        }
                        .label {
                            text-align: center;
                            padding: 20px;
                            border: 2px solid #000;
                            border-radius: 8px;
                        }
                        .code {
                            font-size: 18px;
                            font-weight: bold;
                            margin-top: 10px;
                        }
                        .name {
                            font-size: 14px;
                            color: #666;
                            margin-top: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="label">
                        ${svg.outerHTML}
                        <div class="code">${form.CodigoId}</div>
                        <div class="name">${form.Nombre}</div>
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Montserrat',sans-serif]">
                        {isEdit ? 'Editar Activo' : 'Añadir Activo'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Code Verification Section */}
                {!isEdit && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                Código:
                            </label>
                            <input
                                type="text"
                                name="CodigoId"
                                value={form.CodigoId}
                                onChange={handleChange}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ingresa el código"
                            />
                            <button
                                type="button"
                                onClick={handleVerifyCode}
                                disabled={isVerifying || !form.CodigoId.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    'Verificar Código'
                                )}
                            </button>
                            
                            {/* Verification Status */}
                            {verificationStatus === 'available' && (
                                <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                                    <CheckCircle className="w-5 h-5" />
                                    Código disponible
                                </span>
                            )}
                            {verificationStatus === 'exists' && (
                                <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                                    <AlertCircle className="w-5 h-5" />
                                    Código ya existe
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Form Fields */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Row 1: Nombre y Marca */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Nombre del Activo *
                                    </label>
                                    <input
                                        type="text"
                                        name="Nombre"
                                        value={form.Nombre}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Marca *
                                    </label>
                                    <input
                                        type="text"
                                        name="Marca"
                                        value={form.Marca}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Valor y Cantidad */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Valor *
                                    </label>
                                    <input
                                        type="number"
                                        name="Valoracion"
                                        value={form.Valoracion}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Cantidad *
                                    </label>
                                    <input
                                        type="number"
                                        name="Cantidad"
                                        value={form.Cantidad}
                                        onChange={handleChange}
                                        min="1"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Estado y Grupo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Estado *
                                    </label>
                                    <select
                                        name="Estado"
                                        value={form.Estado}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                    >
                                        {ESTADOS.map(estado => (
                                            <option key={estado} value={estado}>{estado}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Grupo *
                                    </label>
                                    <select
                                        name="Grupo"
                                        value={form.Grupo}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                    >
                                        {GRUPOS.map(grupo => (
                                            <option key={grupo} value={grupo}>{grupo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 4: Zona y Responsable */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Zona *
                                    </label>
                                    <select
                                        name="Zona"
                                        value={form.Zona}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                    >
                                        <option value="">Seleccionar zona</option>
                                        {availableZonas.map(zona => (
                                            <option key={zona} value={zona}>{zona}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Responsable
                                    </label>
                                    <input
                                        type="text"
                                        name="Responsable"
                                        value={form.Responsable}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Fecha Ingreso - Only for edit */}
                            {isEdit && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha de Ingreso
                                    </label>
                                    <input
                                        type="date"
                                        name="FechaIngreso"
                                        value={form.FechaIngreso.split('T')[0]}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    name="Observaciones"
                                    value={form.Observaciones}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>

                        {/* Right Column - Image */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Imagen del Activo
                            </label>
                            
                            {/* Image Preview */}
                            <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 aspect-square flex items-center justify-center overflow-hidden">
                                {form.ImagenUrl ? (
                                    <img
                                        src={form.ImagenUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                                        <p className="text-sm">Sin imagen</p>
                                    </div>
                                )}
                            </div>

                            {/* Image Actions */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleClearImage}
                                    disabled={!form.ImagenUrl}
                                    className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    Limpiar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Subiendo...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Seleccionar
                                        </>
                                    )}
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {/* QR Code Section */}
                            {form.CodigoId && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <QrCode className="w-4 h-4" />
                                            Código QR
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowQR(!showQR)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            {showQR ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {showQR && (
                                        <div className="space-y-3">
                                            <div ref={qrRef} className="p-3 bg-white rounded-lg inline-block">
                                                <QRCodeSVG value={form.CodigoId} size={100} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handlePrintQR}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Imprimir Etiqueta
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading || (!isEdit && verificationStatus !== 'available')}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                isEdit ? 'Guardar Cambios' : 'Guardar Activo'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
