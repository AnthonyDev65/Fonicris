import type { Activo, Usuario, DashboardStats } from '../types';

// Google API Configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Sheet names
const SHEETS = {
    ACTIVOS: 'Activos',
    USUARIOS: 'Usuarios',
};

class GoogleSheetsService {
    /**
     * Makes an authenticated request to the Sheets API using API Key
     */
    private async request<T>(endpoint: string): Promise<T> {
        const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.text();
            console.error('API Error:', error);
            throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
    }

    /**
   * Fetches all assets from the Activos sheet
   * Real structure (row 4 headers, data from row 5):
   * A: No., B: ID, C: Articulo, D: Marca, E: Cant, F: Estado,
   * G: Responsable, H: Fecha, I: Zona, J: Lugar, K: Observacion, L: Valor, M: Imagenes
   */
    async getActivos(): Promise<Activo[]> {
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.ACTIVOS}!A5:M`
        );

        if (!data.values || data.values.length === 0) {
            return [];
        }

        return data.values
            .filter(row => row[0] && row[1]) // Filter out empty rows
            .map((row) => ({
                Numero: parseInt(row[0]) || 0,
                CodigoId: row[1] || '',
                Nombre: row[2] || '',
                Marca: row[3] || '',
                Cantidad: parseInt(row[4]) || 0,
                Estado: (row[5] as Activo['Estado']) || 'Usado',
                Responsable: row[6] || '',
                FechaIngreso: row[7] || '',
                Grupo: row[8] || '', // Zona
                Zona: row[9] || '',  // Lugar
                Observaciones: row[10] || '',
                Valoracion: parseFloat(row[11]) || 0,
                ImagenUrl: row[12] || '',
            }));
    }

    /**
   * Fetches all users from the Usuarios sheet
   * Real structure: Correo (A), Pin (B), Nombre (C), Rol (D)
   */
    async getUsuarios(): Promise<Usuario[]> {
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.USUARIOS}!A2:D`
        );

        if (!data.values || data.values.length === 0) {
            return [];
        }

        return data.values.map((row, index) => ({
            Id: index + 1,
            Nombre: row[2] || '',
            Email: row[0] || '',
            Password: row[1] || '',
            Rol: (row[3] === 'A' ? 'Admin' : row[3] === 'C' ? 'Usuario' : 'Visualizador') as Usuario['Rol'],
            Activo: true, // No Activo column in sheet, assume all are active
        }));
    }

    /**
     * Gets dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const activos = await this.getActivos();

        const now = new Date();
        const fifteenDaysAgo = new Date(now);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        // Count by estado
        const estados = {
            Nuevo: 0,
            Usado: 0,
            Dañado: 0,
        };
        let valorTotal = 0;

        activos.forEach((a) => {
            if (a.Estado in estados) {
                estados[a.Estado]++;
            }
            valorTotal += a.Valoracion * a.Cantidad;
        });

        // Recent assets sorted by date descending
        const activosRecientes = activos
            .filter((a) => {
                const fecha = new Date(a.FechaIngreso);
                return fecha >= fifteenDaysAgo;
            })
            .sort((a, b) => new Date(b.FechaIngreso).getTime() - new Date(a.FechaIngreso).getTime())
            .slice(0, 10);

        // Assets per day for the last 15 days
        const activosPorDia: { fecha: string; cantidad: number }[] = [];
        for (let i = 14; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const count = activos.filter((a) => {
                const fechaIngreso = a.FechaIngreso.split('T')[0];
                return fechaIngreso === dateStr;
            }).length;

            activosPorDia.push({
                fecha: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                cantidad: count,
            });
        }

        return {
            totalActivos: activos.length,
            activosNuevos: estados.Nuevo,
            activosUsados: estados.Usado,
            activosDanados: estados.Dañado,
            valorTotal,
            activosRecientes,
            activosPorDia,
        };
    }

    /**
     * Gets unique values for filter dropdowns
     */
    async getFilterOptions(): Promise<{
        grupos: string[];
        zonas: string[];
        estados: string[];
    }> {
        const activos = await this.getActivos();

        const grupos = [...new Set(activos.map((a) => a.Grupo).filter(Boolean))].sort();
        const zonas = [...new Set(activos.map((a) => a.Zona).filter(Boolean))].sort();
        const estados = ['Nuevo', 'Usado', 'Dañado'];

        return { grupos, zonas, estados };
    }

    // NOTE: Write operations (add, update, delete) require OAuth or Service Account
    // API Keys only support read operations. For write operations, you'll need
    // to set up OAuth 2.0 or use the original Service Account approach.
}

export const googleSheetsService = new GoogleSheetsService();
