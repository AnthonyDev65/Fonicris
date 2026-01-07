import { create } from 'zustand';
import type { Activo, FilterState } from '../types';

interface InventoryState {
    activos: Activo[];
    filteredActivos: Activo[];
    filters: FilterState;
    isLoading: boolean;
    error: string | null;
    selectedActivo: Activo | null;
    sortField: keyof Activo | null;
    sortDirection: 'asc' | 'desc';
    currentPage: number;
    itemsPerPage: number;

    // Actions
    setActivos: (activos: Activo[]) => void;
    setFilters: (filters: Partial<FilterState>) => void;
    applyFilters: () => void;
    setSelectedActivo: (activo: Activo | null) => void;
    setSorting: (field: keyof Activo) => void;
    setPage: (page: number) => void;
    setItemsPerPage: (count: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    refreshData: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    activos: [],
    filteredActivos: [],
    filters: {
        search: '',
        grupo: [],
        zona: [],
        estado: [],
    },
    isLoading: false,
    error: null,
    selectedActivo: null,
    sortField: null,
    sortDirection: 'asc',
    currentPage: 1,
    itemsPerPage: 10,

    setActivos: (activos) => {
        set({ activos, filteredActivos: activos });
    },

    setFilters: (newFilters) => {
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
            currentPage: 1,
        }));
        get().applyFilters();
    },

    applyFilters: () => {
        const { activos, filters, sortField, sortDirection } = get();

        let filtered = [...activos];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
                (a) =>
                    a.Nombre.toLowerCase().includes(searchLower) ||
                    a.CodigoId.toLowerCase().includes(searchLower) ||
                    a.Marca.toLowerCase().includes(searchLower) ||
                    a.Responsable.toLowerCase().includes(searchLower)
            );
        }

        // Multi-select filters
        if (filters.grupo.length > 0) {
            filtered = filtered.filter((a) => filters.grupo.includes(a.Grupo));
        }
        if (filters.zona.length > 0) {
            filtered = filtered.filter((a) => filters.zona.includes(a.Zona));
        }
        if (filters.estado.length > 0) {
            filtered = filtered.filter((a) => filters.estado.includes(a.Estado));
        }

        // Sorting
        if (sortField) {
            filtered.sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortDirection === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                }
                return 0;
            });
        }

        set({ filteredActivos: filtered });
    },

    setSelectedActivo: (activo) => {
        set({ selectedActivo: activo });
    },

    setSorting: (field) => {
        set((state) => ({
            sortField: field,
            sortDirection:
                state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
        }));
        get().applyFilters();
    },

    setPage: (page) => {
        set({ currentPage: page });
    },

    setItemsPerPage: (count) => {
        set({ itemsPerPage: count, currentPage: 1 });
    },

    setLoading: (isLoading) => {
        set({ isLoading });
    },

    setError: (error) => {
        set({ error });
    },

    refreshData: async () => {
        set({ isLoading: true, error: null });
        try {
            const { googleSheetsService } = await import('../services/GoogleSheetsService');
            const activos = await googleSheetsService.getActivos();
            set({ activos, filteredActivos: activos, isLoading: false });
            get().applyFilters();
        } catch (error) {
            set({ error: 'Error al cargar los datos', isLoading: false });
            console.error('Refresh error:', error);
        }
    },
}));
