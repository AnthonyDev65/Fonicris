import { useEffect, useState } from 'react';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { useAuthStore } from '../store/useAuthStore';
import type { Usuario } from '../types';
import { Users, Shield, User, Eye, Loader2, RefreshCw, Pencil, X, Save } from 'lucide-react';

export default function Colaboradores() {
    const { user: currentUser } = useAuthStore();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isPrime = currentUser?.Rol === 'Prime';

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await googleSheetsService.getUsuarios();
            setUsuarios(data);
        } catch (err) {
            setError('Error al cargar los colaboradores');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditUser = (usuario: Usuario) => {
        setEditingUser({ ...usuario });
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        
        setIsSaving(true);
        setError(null);
        try {
            await googleSheetsService.updateUsuario(editingUser);
            // Log user edit activity
            const userName = currentUser?.Nombre || currentUser?.Email || 'Usuario';
            await googleSheetsService.addActivityLog(
                userName,
                'EDITAR_USUARIO',
                `Usuario editado: ${editingUser.Nombre} (${editingUser.Email}) - Rol: ${editingUser.Rol}`
            );
            setEditingUser(null);
            await loadUsuarios();
        } catch (err) {
            setError('Error al guardar los cambios');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditChange = (field: keyof Usuario, value: string) => {
        if (!editingUser) return;
        setEditingUser({ ...editingUser, [field]: value });
    };

    const getRolInfo = (rol: string) => {
        switch (rol) {
            case 'Prime':
                return {
                    label: 'Prime',
                    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                    icon: <Shield className="w-4 h-4" />,
                };
            case 'Admin':
                return {
                    label: 'Administrador',
                    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    icon: <Shield className="w-4 h-4" />,
                };
            case 'Usuario':
                return {
                    label: 'Editor',
                    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    icon: <User className="w-4 h-4" />,
                };
            default:
                return {
                    label: 'Visualizador',
                    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                    icon: <Eye className="w-4 h-4" />,
                };
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando colaboradores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Colaboradores
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {usuarios.length} usuarios registrados
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadUsuarios}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Actualizar</span>
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usuarios.filter(u => u.Rol === 'Prime').length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Prime</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usuarios.filter(u => u.Rol === 'Admin').length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Administradores</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usuarios.filter(u => u.Rol === 'Usuario').length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Editores</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {usuarios.filter(u => u.Rol === 'Visualizador').length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Visualizadores</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-auto h-full">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Usuario
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Rol
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Estado
                                </th>
                                {isPrime && (
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400">
                                        Acciones
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {usuarios.length === 0 ? (
                                <tr>
                                    <td colSpan={isPrime ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                                        No hay colaboradores registrados
                                    </td>
                                </tr>
                            ) : (
                                usuarios.map((usuario) => {
                                    const rolInfo = getRolInfo(usuario.Rol);
                                    return (
                                        <tr 
                                            key={usuario.Id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                            {usuario.Nombre?.charAt(0) || 'U'}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {usuario.Nombre || 'Sin nombre'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                {usuario.Email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${rolInfo.color}`}>
                                                    {rolInfo.icon}
                                                    {rolInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                    usuario.Activo 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {usuario.Activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            {isPrime && (
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleEditUser(usuario)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Editar usuario"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Editar Colaborador
                            </h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={editingUser.Nombre}
                                    onChange={(e) => handleEditChange('Nombre', e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={editingUser.Email}
                                    onChange={(e) => handleEditChange('Email', e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="text"
                                    value={editingUser.Password}
                                    onChange={(e) => handleEditChange('Password', e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={editingUser.Rol}
                                    onChange={(e) => handleEditChange('Rol', e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Prime">Prime (Z)</option>
                                    <option value="Admin">Administrador (A)</option>
                                    <option value="Usuario">Editor (B)</option>
                                    <option value="Visualizador">Visualizador (C)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
