import { useState, useRef } from 'react';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { googleDriveService } from '../services/GoogleDriveService';
import type { Activo } from '../types';
import {
    X,
    Loader2,
    Upload,
    Image as ImageIcon,
    QrCode,
    Printer,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface AssetModalProps {
    asset: Activo | null;
    onClose: () => void;
    onSave: () => void;
}

const initialFormState: Omit<Activo, 'Numero'> = {
    CodigoId: '',
    Nombre: '',
    Marca: '',
    Cantidad: 1,
    Estado: 'Nuevo',
    Responsable: '',
    FechaIngreso: new Date().toISOString().split('T')[0],
    Grupo: '',
    Zona: '',
    Observaciones: '',
    Valoracion: 0,
    ImagenUrl: '',
};

export default function AssetModal({ asset, onClose, onSave }: AssetModalProps) {
    const [form, setForm] = useState<Omit<Activo, 'Numero'>>(() =>
        asset ? { ...asset } : { ...initialFormState }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const isEdit = asset !== null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isEdit && asset) {
                await googleSheetsService.updateActivo({ ...form, Numero: asset.Numero });
            } else {
                await googleSheetsService.addActivo(form);
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {isEdit ? 'Editar Activo' : 'Nuevo Activo'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-white/70" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Código */}
                        <div>
                            <label className="label-text">Código ID *</label>
                            <input
                                type="text"
                                name="CodigoId"
                                value={form.CodigoId}
                                onChange={handleChange}
                                className="input-glass"
                                required
                            />
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="label-text">Nombre *</label>
                            <input
                                type="text"
                                name="Nombre"
                                value={form.Nombre}
                                onChange={handleChange}
                                className="input-glass"
                                required
                            />
                        </div>

                        {/* Marca */}
                        <div>
                            <label className="label-text">Marca</label>
                            <input
                                type="text"
                                name="Marca"
                                value={form.Marca}
                                onChange={handleChange}
                                className="input-glass"
                            />
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label className="label-text">Cantidad</label>
                            <input
                                type="number"
                                name="Cantidad"
                                value={form.Cantidad}
                                onChange={handleChange}
                                min="0"
                                className="input-glass"
                            />
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="label-text">Estado *</label>
                            <select
                                name="Estado"
                                value={form.Estado}
                                onChange={handleChange}
                                className="select-glass"
                                required
                            >
                                <option value="Nuevo">Nuevo</option>
                                <option value="Usado">Usado</option>
                                <option value="Dañado">Dañado</option>
                            </select>
                        </div>

                        {/* Responsable */}
                        <div>
                            <label className="label-text">Responsable</label>
                            <input
                                type="text"
                                name="Responsable"
                                value={form.Responsable}
                                onChange={handleChange}
                                className="input-glass"
                            />
                        </div>

                        {/* Fecha Ingreso */}
                        <div>
                            <label className="label-text">Fecha Ingreso</label>
                            <input
                                type="date"
                                name="FechaIngreso"
                                value={form.FechaIngreso.split('T')[0]}
                                onChange={handleChange}
                                className="input-glass"
                            />
                        </div>

                        {/* Valoración */}
                        <div>
                            <label className="label-text">Valoración ($)</label>
                            <input
                                type="number"
                                name="Valoracion"
                                value={form.Valoracion}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="input-glass"
                            />
                        </div>

                        {/* Grupo */}
                        <div>
                            <label className="label-text">Grupo</label>
                            <input
                                type="text"
                                name="Grupo"
                                value={form.Grupo}
                                onChange={handleChange}
                                className="input-glass"
                            />
                        </div>

                        {/* Zona */}
                        <div>
                            <label className="label-text">Zona</label>
                            <input
                                type="text"
                                name="Zona"
                                value={form.Zona}
                                onChange={handleChange}
                                className="input-glass"
                            />
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="label-text">Observaciones</label>
                        <textarea
                            name="Observaciones"
                            value={form.Observaciones}
                            onChange={handleChange}
                            rows={3}
                            className="input-glass resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="label-text">Imagen</label>
                        <div className="flex items-center gap-4">
                            {form.ImagenUrl ? (
                                <div className="relative">
                                    <img
                                        src={form.ImagenUrl}
                                        alt="Preview"
                                        className="w-24 h-24 object-cover rounded-xl border border-white/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, ImagenUrl: '' }))}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-white/20" />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5" />
                                    )}
                                    {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    {form.CodigoId && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <QrCode className="w-5 h-5" />
                                    Código QR
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowQR(!showQR)}
                                    className="text-primary-400 hover:text-primary-300 text-sm"
                                >
                                    {showQR ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>
                            {showQR && (
                                <div className="flex items-center gap-4">
                                    <div ref={qrRef} className="p-4 bg-white rounded-xl">
                                        <QRCodeSVG value={form.CodigoId} size={120} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handlePrintQR}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <Printer className="w-5 h-5" />
                                        Imprimir Etiqueta
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>{isEdit ? 'Guardar Cambios' : 'Crear Activo'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
