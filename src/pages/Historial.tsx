import { useEffect, useState } from 'react';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { History, Loader2, RefreshCw, Clock, User, LogIn, Plus, Edit, Trash2, UserCog, Package, Calendar } from 'lucide-react';

interface ActivityLog {
    Numero: number;
    Fecha: string;
    Hora: string;
    Usuario: string;
    Accion: string;
    Detalle: string;
}

interface ActivoEliminado {
    Numero: number;
    CodigoId: string;
    Nombre: string;
    Marca: string;
    Cantidad: number;
    Estado: string;
    Responsable: string;
    FechaIngreso: string;
    Grupo: string;
    Zona: string;
    Observaciones: string;
    Valoracion: number;
    ImagenUrl: string;
    FechaEliminacion: string;
}

type TabType = 'actividad' | 'eliminados';

export default function Historial() {
    const [activeTab, setActiveTab] = useState<TabType>('actividad');
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [eliminados, setEliminados] = useState<ActivoEliminado[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [logsData, eliminadosData] = await Promise.all([
                googleSheetsService.getActivityLogs(),
                googleSheetsService.getHistorial()
            ]);
            setLogs(logsData);
            setEliminados(eliminadosData);
        } catch (err) {
            setError('Error al cargar los datos');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (!filter) return true;
        return log.Accion === filter;
    });

    const getActionIcon = (accion: string) => {
        switch (accion) {
            case 'LOGIN': return <LogIn className="w-4 h-4" />;
            case 'CREAR': return <Plus className="w-4 h-4" />;
            case 'EDITAR': return <Edit className="w-4 h-4" />;
            case 'ELIMINAR': return <Trash2 className="w-4 h-4" />;
            case 'EDITAR_USUARIO': return <UserCog className="w-4 h-4" />;
            default: return <History className="w-4 h-4" />;
        }
    };

    const getActionColor = (accion: string) => {
        switch (accion) {
            case 'LOGIN': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'CREAR': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'EDITAR': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'ELIMINAR': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'EDITAR_USUARIO': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getActionLabel = (accion: string) => {
        switch (accion) {
            case 'LOGIN': return 'Inicio de sesión';
            case 'CREAR': return 'Crear activo';
            case 'EDITAR': return 'Editar activo';
            case 'ELIMINAR': return 'Eliminar activo';
            case 'EDITAR_USUARIO': return 'Editar usuario';
            default: return accion;
        }
    };

    const StatusBadge = ({ estado }: { estado: string }) => {
        const colors: Record<string, string> = {
            Nuevo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            Usado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            Dañado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[estado] || 'bg-gray-100 text-gray-700'}`}>
                {estado}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando historial...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {activeTab === 'actividad' ? `${filteredLogs.length} registros` : `${eliminados.length} activos eliminados`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualizar</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('actividad')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'actividad'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Registro de Actividad
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('eliminados')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'eliminados'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Activos Eliminados ({eliminados.length})
                    </span>
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'actividad' ? (
                <>
                    {/* Activity Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === '' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200'}`}>
                            Todos
                        </button>
                        <button onClick={() => setFilter('LOGIN')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'LOGIN' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            <LogIn className="w-3.5 h-3.5" /> Login
                        </button>
                        <button onClick={() => setFilter('CREAR')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'CREAR' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                            <Plus className="w-3.5 h-3.5" /> Crear
                        </button>
                        <button onClick={() => setFilter('EDITAR')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'EDITAR' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            <Edit className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button onClick={() => setFilter('ELIMINAR')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'ELIMINAR' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2">
                                <LogIn className="w-4 h-4 text-blue-500" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{logs.filter(l => l.Accion === 'LOGIN').length}</span>
                            </div>
                            <p className="text-xs text-gray-500">Logins</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-green-500" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{logs.filter(l => l.Accion === 'CREAR').length}</span>
                            </div>
                            <p className="text-xs text-gray-500">Creados</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2">
                                <Edit className="w-4 h-4 text-amber-500" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{logs.filter(l => l.Accion === 'EDITAR').length}</span>
                            </div>
                            <p className="text-xs text-gray-500">Editados</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4 text-red-500" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{logs.filter(l => l.Accion === 'ELIMINAR').length}</span>
                            </div>
                            <p className="text-xs text-gray-500">Eliminados</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-purple-500" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{logs.filter(l => l.Accion === 'EDITAR_USUARIO').length}</span>
                            </div>
                            <p className="text-xs text-gray-500">Usuarios</p>
                        </div>
                    </div>

                    {/* Activity List */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-auto h-full">
                            {filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                                    <History className="w-12 h-12 mb-3 opacity-50" />
                                    <p>No hay registros de actividad</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredLogs.map((log, index) => (
                                        <div key={`${log.Numero}-${index}`} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(log.Accion)}`}>
                                                {getActionIcon(log.Accion)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionColor(log.Accion)}`}>
                                                        {getActionLabel(log.Accion)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-900 dark:text-white font-medium truncate">{log.Detalle}</p>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{log.Usuario}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{log.Fecha} {log.Hora}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Deleted Assets Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{eliminados.length}</p>
                                    <p className="text-sm text-gray-500">Total eliminados</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {eliminados.filter(a => {
                                            const fecha = new Date(a.FechaEliminacion);
                                            const hoy = new Date();
                                            return (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24) <= 30;
                                        }).length}
                                    </p>
                                    <p className="text-sm text-gray-500">Últimos 30 días</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deleted Assets Table */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-auto h-full">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Código</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Nombre</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Marca</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Cant</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Estado</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Responsable</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Grupo</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Zona</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Valor</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Eliminado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {eliminados.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                                                <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No hay activos eliminados</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        eliminados.map((activo, index) => (
                                            <tr key={`${activo.CodigoId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{activo.CodigoId}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[150px] truncate">{activo.Nombre}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{activo.Marca}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{activo.Cantidad}</span>
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge estado={activo.Estado} /></td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[120px] truncate">{activo.Responsable}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{activo.Grupo}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{activo.Zona}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">${activo.Valoracion}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-sm">{activo.FechaEliminacion || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
