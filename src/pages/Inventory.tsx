import { useEffect, useState, useMemo } from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { googleSheetsService } from '../services/GoogleSheetsService';
import type { Activo } from '../types';
import * as XLSX from 'xlsx';
import AssetModal from '../components/AssetModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ImageLightbox from '../components/ImageLightbox';

export default function Inventory() {
    const {
        filteredActivos,
        filters,
        setFilters,
        isLoading,
        refreshData,
        sortField,
        sortDirection,
        setSorting,
        currentPage,
        setPage,
        itemsPerPage,
        setItemsPerPage,
    } = useInventoryStore();

    const { user } = useAuthStore();
    
    // Check permissions
    const canDelete = user?.Rol === 'Prime' || user?.Rol === 'Admin';

    const [filterOptions, setFilterOptions] = useState<{
        grupos: string[];
        zonas: string[];
        estados: string[];
    }>({ grupos: [], zonas: [], estados: [] });

    const [selectedAsset, setSelectedAsset] = useState<Activo | null>(null);
    
    // Modal states
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Activo | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showImageLightbox, setShowImageLightbox] = useState(false);

    useEffect(() => {
        refreshData();
        loadFilterOptions();
    }, []);

    const loadFilterOptions = async () => {
        try {
            const options = await googleSheetsService.getFilterOptions();
            setFilterOptions(options);
        } catch (err) {
            console.error('Error loading filter options:', err);
        }
    };

    // Pagination
    const paginatedActivos = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredActivos
            .filter((activo) => activo.Nombre && activo.Nombre.trim() !== '')
            .slice(start, start + itemsPerPage);
    }, [filteredActivos, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredActivos.length / itemsPerPage);
    const startItem = filteredActivos.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, filteredActivos.length);

    // Handlers
    const handleAddAsset = () => {
        setEditingAsset(null);
        setShowAssetModal(true);
    };

    const handleEditAsset = () => {
        if (selectedAsset) {
            setEditingAsset(selectedAsset);
            setShowAssetModal(true);
        }
    };

    const handleViewAsset = () => {
        if (selectedAsset?.ImagenUrl) {
            setShowImageLightbox(true);
        }
    };

    const handleDeleteAsset = () => {
        if (selectedAsset) {
            setShowDeleteModal(true);
        }
    };

    const confirmDelete = async () => {
        if (!selectedAsset) return;
        
        setIsDeleting(true);
        try {
            await googleSheetsService.deleteActivo(selectedAsset);
            // Log delete activity
            const userName = user?.Nombre || user?.Email || 'Usuario';
            await googleSheetsService.addActivityLog(
                userName,
                'ELIMINAR',
                `Activo eliminado: ${selectedAsset.CodigoId} - ${selectedAsset.Nombre}`
            );
            setShowDeleteModal(false);
            setSelectedAsset(null);
            await refreshData();
        } catch (err) {
            console.error('Error deleting asset:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveAsset = async () => {
        setShowAssetModal(false);
        setEditingAsset(null);
        setSelectedAsset(null);
        await refreshData();
        await loadFilterOptions();
    };

    const handleExportExcel = () => {
        const data = filteredActivos.map((a) => ({
            'Número': a.Numero,
            'Código': a.CodigoId,
            'Nombre': a.Nombre,
            'Marca': a.Marca,
            'Cantidad': a.Cantidad,
            'Estado': a.Estado,
            'Responsable': a.Responsable,
            'Fecha Ingreso': a.FechaIngreso,
            'Grupo': a.Grupo,
            'Zona': a.Zona,
            'Observaciones': a.Observaciones,
            'Valoración': a.Valoracion,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
        XLSX.writeFile(wb, `inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportSelected = () => {
        if (!selectedAsset) return;
        
        const data = [{
            'Número': selectedAsset.Numero,
            'Código': selectedAsset.CodigoId,
            'Nombre': selectedAsset.Nombre,
            'Marca': selectedAsset.Marca,
            'Cantidad': selectedAsset.Cantidad,
            'Estado': selectedAsset.Estado,
            'Responsable': selectedAsset.Responsable,
            'Fecha Ingreso': selectedAsset.FechaIngreso,
            'Grupo': selectedAsset.Grupo,
            'Zona': selectedAsset.Zona,
            'Observaciones': selectedAsset.Observaciones,
            'Valoración': selectedAsset.Valoracion,
        }];

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Activo');
        XLSX.writeFile(wb, `activo_${selectedAsset.CodigoId}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Components
    const SortHeader = ({ field, label }: { field: keyof Activo; label: string }) => (
        <th
            onClick={() => setSorting(field)}
            className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            <div className="flex items-center gap-1">
                {label}
                {sortField === field && (
                    <span className="text-blue-500">
                        {sortDirection === 'asc' ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                            </svg>
                        )}
                    </span>
                )}
            </div>
        </th>
    );

    const StatusBadge = ({ estado }: { estado: string }) => {
        const colors = {
            Nuevo: 'bg-emerald-500 text-white',
            Usado: 'bg-amber-500 text-white',
            Dañado: 'bg-red-500 text-white',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[estado as keyof typeof colors] || 'bg-gray-400 text-white'}`}>
                {estado}
            </span>
        );
    };

    const GroupBadge = ({ grupo }: { grupo: string }) => (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-400 text-yellow-900">
            {grupo}
        </span>
    );

    const QuantityBadge = ({ cantidad }: { cantidad: number }) => (
        <span className="px-2 py-0.5 rounded text-sm font-semibold bg-blue-500 text-white min-w-[24px] text-center inline-block">
            {cantidad}
        </span>
    );

    const ValueBadge = ({ valor }: { valor: number }) => (
        <span className="px-2 py-0.5 rounded text-sm font-semibold bg-green-500 text-white">
            ${valor}
        </span>
    );

    const LugarBadge = ({ lugar }: { lugar: string }) => (
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500 text-white">
            {lugar}
        </span>
    );

    if (isLoading && filteredActivos.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Cargando inventario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Mobile Filters */}
            <div className="lg:hidden flex gap-2 mb-4 flex-shrink-0">
                <select
                    value={filters.grupo?.[0] || ''}
                    onChange={(e) => setFilters({ grupo: e.target.value ? [e.target.value] : [] })}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 text-sm"
                >
                    <option value="">Seleccionar Grupo</option>
                    {filterOptions.grupos.map((g) => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
                <select
                    value={filters.zona?.[0] || ''}
                    onChange={(e) => setFilters({ zona: e.target.value ? [e.target.value] : [] })}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 text-sm"
                >
                    <option value="">Seleccionar Zona</option>
                    {filterOptions.zonas.map((z) => (
                        <option key={z} value={z}>{z}</option>
                    ))}
                </select>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden lg:block bg-transparent mb-4 flex-shrink-0">
                <div className="relative max-w-xl">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27c1.2-1.4 1.82-3.31 1.48-5.34-.47-2.78-2.79-5-5.59-5.34-4.23-.52-7.79 3.04-7.27 7.27.34 2.8 2.56 5.12 5.34 5.59 2.03.34 3.94-.28 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar Activos"
                        value={filters.search}
                        onChange={(e) => setFilters({ search: e.target.value })}
                        className="w-full pl-12 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Desktop Toolbar */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 mb-4 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                    {/* View Button */}
                    <button
                        onClick={handleViewAsset}
                        disabled={!selectedAsset?.ImagenUrl}
                        className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Ver imagen"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                    </button>

                    {/* Edit Button */}
                    <button
                        onClick={handleEditAsset}
                        disabled={!selectedAsset}
                        className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Editar activo"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                    </button>

                    {/* Delete Button - Solo Prime y Admin */}
                    {canDelete && (
                        <button
                            onClick={handleDeleteAsset}
                            disabled={!selectedAsset}
                            className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            title="Eliminar activo"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v10zM18 4h-2.5l-.71-.71c-.18-.18-.44-.29-.7-.29H9.91c-.26 0-.52.11-.7.29L8.5 4H6c-.55 0-1 .45-1 1s.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1z" />
                            </svg>
                        </button>
                    )}

                    <div className="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded mx-1"></div>

                    {/* Export Selected Button */}
                    <button
                        onClick={handleExportSelected}
                        disabled={!selectedAsset}
                        className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="Exportar selección"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                    </button>

                    <div className="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded mx-1"></div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddAsset}
                        className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        title="Agregar nuevo activo"
                    >
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                    </button>

                    {/* Export All Button */}
                    <button
                        onClick={handleExportExcel}
                        className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                        title="Exportar todo"
                    >
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                        </svg>
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={() => refreshData()}
                        className={`p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all ${isLoading ? 'animate-spin' : ''}`}
                        title="Actualizar lista"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden flex-1 overflow-y-auto space-y-3">
                {/* Mobile Add Button */}
                <button
                    onClick={handleAddAsset}
                    className="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Añadir Activo
                </button>

                {paginatedActivos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No se encontraron activos
                    </div>
                ) : (
                    paginatedActivos.map((activo) => (
                        <div
                            key={activo.Numero}
                            onClick={() => setSelectedAsset(activo)}
                            className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all ${
                                selectedAsset?.Numero === activo.Numero
                                    ? 'border-blue-500 shadow-md'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-gray-900 dark:text-white font-bold text-base">
                                        {activo.Nombre}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Marca: {activo.Marca || 'N/A'}
                                    </p>
                                </div>
                                <span className="text-gray-400 dark:text-gray-500 text-sm font-medium font-mono">
                                    {activo.CodigoId}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <StatusBadge estado={activo.Estado} />
                                <QuantityBadge cantidad={activo.Cantidad} />
                                <ValueBadge valor={activo.Valoracion} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <GroupBadge grupo={activo.Grupo} />
                                <LugarBadge lugar={activo.Zona} />
                            </div>

                            {/* Mobile Action Buttons */}
                            {selectedAsset?.Numero === activo.Numero && (
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditAsset(); }}
                                        className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    {canDelete && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(); }}
                                            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Data Table */}
            <div className="hidden lg:flex flex-col flex-1 min-h-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="overflow-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                                <tr>
                                    <SortHeader field="CodigoId" label="#" />
                                    <SortHeader field="Nombre" label="Nombre" />
                                    <SortHeader field="Cantidad" label="Cant" />
                                    <SortHeader field="Marca" label="Marca" />
                                    <SortHeader field="Responsable" label="Responsable" />
                                    <SortHeader field="Grupo" label="Grupo" />
                                    <SortHeader field="Zona" label="Zona" />
                                    <SortHeader field="Valoracion" label="Valor" />
                                    <SortHeader field="Estado" label="Estado" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedActivos.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                            No se encontraron activos
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedActivos.map((activo) => (
                                        <tr
                                            key={activo.Numero}
                                            onClick={() => setSelectedAsset(activo)}
                                            onDoubleClick={() => { setEditingAsset(activo); setShowAssetModal(true); }}
                                            className={`cursor-pointer transition-colors ${
                                                selectedAsset?.Numero === activo.Numero
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-bold text-gray-900 dark:text-white font-mono">{activo.CodigoId}</span>
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px] truncate" title={activo.Nombre}>
                                                <span className="font-semibold text-gray-900 dark:text-white">{activo.Nombre}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <QuantityBadge cantidad={activo.Cantidad} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-semibold max-w-[120px] truncate">
                                                {activo.Marca}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-semibold max-w-[150px] truncate">
                                                {activo.Responsable}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <GroupBadge grupo={activo.Grupo} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <LugarBadge lugar={activo.Zona} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <ValueBadge valor={activo.Valoracion} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge estado={activo.Estado} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Desktop Pagination */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 mt-4 flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>Mostrando</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span>
                            <span>-</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span>
                            <span>de</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{filteredActivos.length}</span>
                            <span>elementos</span>
                        </div>

                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                            <div className="px-3 py-2 border-r border-gray-300 dark:border-gray-600">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="bg-transparent text-gray-700 dark:text-gray-300 text-sm focus:outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border-r border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Pagination */}
            <div className="lg:hidden flex items-center justify-between pt-4 flex-shrink-0">
                <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
                >
                    Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentPage} / {totalPages || 1}
                </span>
                <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
                >
                    Siguiente
                </button>
            </div>

            {/* Modals */}
            {showAssetModal && (
                <AssetModal
                    asset={editingAsset}
                    onClose={() => { setShowAssetModal(false); setEditingAsset(null); }}
                    onSave={handleSaveAsset}
                />
            )}

            {showDeleteModal && selectedAsset && (
                <DeleteConfirmModal
                    asset={selectedAsset}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    isLoading={isDeleting}
                />
            )}

            {showImageLightbox && selectedAsset?.ImagenUrl && (
                <ImageLightbox
                    imageUrl={selectedAsset.ImagenUrl}
                    onClose={() => setShowImageLightbox(false)}
                />
            )}
        </div>
    );
}
