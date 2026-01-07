import { useEffect, useState } from 'react';
import { googleSheetsService } from '../services/GoogleSheetsService';
import type { DashboardStats } from '../types';
import {
    Package,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    DollarSign,
    TrendingUp,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

const COLORS = {
    nuevo: '#10b981',
    usado: '#f59e0b',
    danado: '#ef4444',
};

const CHART_GRADIENT_ID = 'areaGradient';

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await googleSheetsService.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError('Error al cargar las estadísticas');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{error || 'Error desconocido'}</p>
                    <button onClick={loadStats} className="btn-primary">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const pieData = [
        { name: 'Nuevos', value: stats.activosNuevos, color: COLORS.nuevo },
        { name: 'Usados', value: stats.activosUsados, color: COLORS.usado },
        { name: 'Dañados', value: stats.activosDanados, color: COLORS.danado },
    ];

    const statCards = [
        {
            title: 'Total Activos',
            value: stats.totalActivos,
            icon: Package,
            gradient: 'from-blue-500 to-blue-600',
            shadowColor: 'shadow-blue-500/25',
        },
        {
            title: 'En Buen Estado',
            value: stats.activosNuevos,
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-emerald-600',
            shadowColor: 'shadow-emerald-500/25',
        },
        {
            title: 'En Uso',
            value: stats.activosUsados,
            icon: TrendingUp,
            gradient: 'from-amber-500 to-amber-600',
            shadowColor: 'shadow-amber-500/25',
        },
        {
            title: 'Requieren Atención',
            value: stats.activosDanados,
            icon: AlertTriangle,
            gradient: 'from-red-500 to-red-600',
            shadowColor: 'shadow-red-500/25',
        },
        {
            title: 'Valor Total',
            value: `$${stats.valorTotal.toLocaleString()}`,
            icon: DollarSign,
            gradient: 'from-violet-500 to-violet-600',
            shadowColor: 'shadow-violet-500/25',
        },
    ];

    return (
        <div className="h-full overflow-y-auto space-y-6 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Resumen general del inventario</p>
                </div>
                <button
                    onClick={loadStats}
                    disabled={isLoading}
                    className="btn-secondary flex items-center gap-2 self-start"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {statCards.map((card, index) => (
                    <div
                        key={card.title}
                        className="stat-card animate-in flex gap-4"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadowColor} shadow-lg flex items-center justify-center`}
                        >
                            <card.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart - Estado de Activos */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Estado de Activos</h2>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="transparent"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '12px',
                                    }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => (
                                        <span className="text-gray-700 dark:text-gray-300">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-18px' }}>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalActivos}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
                        </div>
                    </div>
                </div>

                {/* Area Chart - Activos por Día */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Activos Agregados (Últimos 15 días)
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.activosPorDia}>
                                <defs>
                                    <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.3)" />
                                <XAxis
                                    dataKey="fecha"
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(156,163,175,0.3)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(156,163,175,0.3)' }}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid rgba(0, 0, 0, 0.1)',
                                        borderRadius: '12px',
                                    }}
                                    labelStyle={{ color: '#1f2937' }}
                                    itemStyle={{ color: '#6366f1' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cantidad"
                                    name="Activos"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fill={`url(#${CHART_GRADIENT_ID})`}
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Assets Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Activos Recientes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
                                <th className="pb-4 pr-4">Código</th>
                                <th className="pb-4 pr-4">Nombre</th>
                                <th className="pb-4 pr-4">Marca</th>
                                <th className="pb-4 pr-4">Estado</th>
                                <th className="pb-4 pr-4">Responsable</th>
                                <th className="pb-4">Fecha Ingreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.activosRecientes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">
                                        No hay activos recientes
                                    </td>
                                </tr>
                            ) : (
                                stats.activosRecientes.map((activo) => (
                                    <tr key={activo.Numero} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-4 pr-4">
                                            <span className="font-mono text-blue-600 dark:text-blue-400">{activo.CodigoId}</span>
                                        </td>
                                        <td className="py-4 pr-4 text-gray-900 dark:text-white">{activo.Nombre}</td>
                                        <td className="py-4 pr-4 text-gray-600 dark:text-gray-300">{activo.Marca}</td>
                                        <td className="py-4 pr-4">
                                            <span
                                                className={
                                                    activo.Estado === 'Nuevo'
                                                        ? 'px-3 py-1 text-sm font-semibold rounded-full bg-emerald-500 text-white'
                                                        : activo.Estado === 'Usado'
                                                            ? 'px-3 py-1 text-sm font-semibold rounded-full bg-amber-500 text-white'
                                                            : 'px-3 py-1 text-sm font-semibold rounded-full bg-red-500 text-white'
                                                }
                                            >
                                                {activo.Estado}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-gray-600 dark:text-gray-300">{activo.Responsable}</td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(activo.FechaIngreso).toLocaleDateString('es-ES')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
