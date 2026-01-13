import type { Activo, Usuario, DashboardStats } from '../types';

// Google API Configuration
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Sheet names
const SHEETS = {
    ACTIVOS: 'Activos',
    USUARIOS: 'Usuarios',
    HISTORIAL: 'Historial',
    LOGS: 'Logs', // Nueva hoja para registro de actividades
};

class GoogleSheetsService {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    /**
     * Gets an OAuth access token using Service Account JWT
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
            return this.accessToken;
        }

        const header = { alg: 'RS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const claim = {
            iss: SERVICE_ACCOUNT_EMAIL,
            scope: 'https://www.googleapis.com/auth/spreadsheets',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        };

        const base64UrlEncode = (obj: object): string => {
            const str = JSON.stringify(obj);
            const base64 = btoa(unescape(encodeURIComponent(str)));
            return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const headerB64 = base64UrlEncode(header);
        const claimB64 = base64UrlEncode(claim);
        const signatureInput = `${headerB64}.${claimB64}`;

        const privateKey = await this.importPrivateKey(PRIVATE_KEY);
        const signature = await this.signData(signatureInput, privateKey);
        const jwt = `${signatureInput}.${signature}`;

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${await response.text()}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000;
        return this.accessToken!;
    }

    private async importPrivateKey(pem: string): Promise<CryptoKey> {
        if (!pem) throw new Error('Private key is missing');

        const pemContents = pem
            .replace(/-----BEGIN PRIVATE KEY-----/g, '')
            .replace(/-----END PRIVATE KEY-----/g, '')
            .replace(/[^A-Za-z0-9+/=]/g, '');

        try {
            const binaryStr = atob(pemContents);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            return await crypto.subtle.importKey(
                'pkcs8',
                bytes.buffer,
                { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
                false,
                ['sign']
            );
        } catch (e) {
            console.error('Error decoding private key:', e);
            throw new Error('Error al decodificar la clave privada.');
        }
    }

    private async signData(data: string, key: CryptoKey): Promise<string> {
        const encoder = new TextEncoder();
        const signature = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            key,
            encoder.encode(data)
        );

        const bytes = new Uint8Array(signature);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    /**
     * Makes an authenticated request to the Sheets API
     */
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const token = await this.getAccessToken();
        const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...options?.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('API Error:', error);
            throw new Error(`API request failed: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Fetches all assets from the Activos sheet
     */
    async getActivos(): Promise<Activo[]> {
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.ACTIVOS}!A5:M`
        );

        if (!data.values || data.values.length === 0) {
            return [];
        }

        return data.values
            .filter(row => row[0] && row[1] && row[2])
            .map((row) => ({
                Numero: parseInt(row[0]) || 0,
                CodigoId: row[1] || '',
                Nombre: row[2] || '',
                Marca: row[3] || '',
                Cantidad: parseInt(row[4]) || 0,
                Estado: (row[5] as Activo['Estado']) || 'Usado',
                Responsable: row[6] || '',
                FechaIngreso: row[7] || '',
                Grupo: row[8] || '',
                Zona: row[9] || '',
                Observaciones: row[10] || '',
                Valoracion: parseFloat(row[11]) || 0,
                ImagenUrl: row[12] || '',
            }));
    }

    /**
     * Gets the row number for a given CodigoId
     * Returns the row only if the asset has data (not deleted)
     */
    async getRowByCodigoId(codigoId: string): Promise<number | null> {
        // Get columns B (CodigoId) and C (Nombre) to verify the row has data
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.ACTIVOS}!B:C`
        );

        if (!data.values) return null;

        for (let i = 5; i < data.values.length; i++) {
            const codigo = data.values[i]?.[0]?.trim();
            const nombre = data.values[i]?.[1]?.trim();
            
            // Only return if codigo matches AND nombre exists (not deleted)
            if (codigo === codigoId.trim() && nombre) {
                return i + 1; // Google Sheets is 1-indexed
            }
        }
        return null;
    }

    /**
     * Gets the row number for a given CodigoId (including empty/deleted rows)
     * Used for finding where to insert data for reused codes
     */
    async getRowByCodigoIdIncludingEmpty(codigoId: string): Promise<number | null> {
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.ACTIVOS}!B:B`
        );

        if (!data.values) return null;

        for (let i = 5; i < data.values.length; i++) {
            if (data.values[i]?.[0]?.trim() === codigoId.trim()) {
                return i + 1;
            }
        }
        return null;
    }

    /**
     * Gets the next available row number
     */
    async getNextRowNumber(): Promise<number> {
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.ACTIVOS}!A:A`
        );

        if (!data.values) return 6;

        let lastRow = 5;
        for (let i = 5; i < data.values.length; i++) {
            if (data.values[i]?.[0]) {
                lastRow = i + 1;
            }
        }
        return lastRow + 1;
    }

    /**
     * Gets the next sequential number for new assets
     */
    async getNextAssetNumber(): Promise<number> {
        const activos = await this.getActivos();
        if (activos.length === 0) return 1;
        return Math.max(...activos.map(a => a.Numero)) + 1;
    }

    /**
     * Checks if a CodigoId already exists
     */
    async checkCodigoExists(codigoId: string): Promise<boolean> {
        const row = await this.getRowByCodigoId(codigoId);
        return row !== null;
    }

    /**
     * Adds a new asset to the sheet
     * If the code exists but was deleted (empty data), reuses that row
     */
    async addActivo(activo: Omit<Activo, 'Numero'>): Promise<boolean> {
        try {
            // Check if this code exists in an empty/deleted row
            const existingRow = await this.getRowByCodigoIdIncludingEmpty(activo.CodigoId);
            
            let targetRow: number;
            let numero: number;

            if (existingRow) {
                // Reuse the existing row (code was deleted before)
                targetRow = existingRow;
                // Get the existing number from column A
                const numData = await this.request<{ values: string[][] }>(
                    `/values/${SHEETS.ACTIVOS}!A${existingRow}`
                );
                numero = parseInt(numData.values?.[0]?.[0]) || await this.getNextAssetNumber();
            } else {
                // New row
                targetRow = await this.getNextRowNumber();
                numero = await this.getNextAssetNumber();
            }

            const values = [[
                numero,
                activo.CodigoId,
                activo.Nombre,
                activo.Marca,
                activo.Cantidad,
                activo.Estado,
                activo.Responsable,
                activo.FechaIngreso,
                activo.Grupo,
                activo.Zona,
                activo.Observaciones,
                activo.Valoracion,
                activo.ImagenUrl
            ]];

            const token = await this.getAccessToken();
            const response = await fetch(
                `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEETS.ACTIVOS}!A${targetRow}:M${targetRow}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ values })
                }
            );

            if (!response.ok) {
                const error = await response.text();
                console.error('Error adding asset:', error);
                throw new Error('Failed to add asset');
            }

            return true;
        } catch (error) {
            console.error('Error adding asset:', error);
            throw error;
        }
    }

    /**
     * Updates an existing asset
     */
    async updateActivo(activo: Activo): Promise<boolean> {
        try {
            // Use the method that checks for actual data
            const rowIndex = await this.getRowByCodigoId(activo.CodigoId);
            if (!rowIndex) {
                throw new Error('Asset not found');
            }

            const values = [[
                activo.CodigoId,
                activo.Nombre,
                activo.Marca,
                activo.Cantidad,
                activo.Estado,
                activo.Responsable,
                activo.FechaIngreso,
                activo.Grupo,
                activo.Zona,
                activo.Observaciones,
                activo.Valoracion,
                activo.ImagenUrl
            ]];

            const token = await this.getAccessToken();
            const response = await fetch(
                `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEETS.ACTIVOS}!B${rowIndex}:M${rowIndex}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ values })
                }
            );

            if (!response.ok) {
                const error = await response.text();
                console.error('Error updating asset:', error);
                throw new Error('Failed to update asset');
            }

            return true;
        } catch (error) {
            console.error('Error updating asset:', error);
            throw error;
        }
    }

    /**
     * Deletes an asset by moving it to history and clearing the row
     */
    async deleteActivo(activo: Activo): Promise<boolean> {
        try {
            const rowIndex = await this.getRowByCodigoId(activo.CodigoId);
            if (!rowIndex) {
                throw new Error('Asset not found');
            }

            // First, add to history
            await this.addToHistory(activo);

            // Then clear the row in Activos (columns C to M - keep A and B)
            const emptyValues = [['', '', '', '', '', '', '', '', '', '', '']];

            const token = await this.getAccessToken();
            const response = await fetch(
                `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEETS.ACTIVOS}!C${rowIndex}:M${rowIndex}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ values: emptyValues })
                }
            );

            if (!response.ok) {
                const error = await response.text();
                console.error('Error deleting asset:', error);
                throw new Error('Failed to delete asset');
            }

            return true;
        } catch (error) {
            console.error('Error deleting asset:', error);
            throw error;
        }
    }

    /**
     * Adds an asset to the history sheet
     */
    private async addToHistory(activo: Activo): Promise<void> {
        try {
            // Get next row in history
            let nextRow = 6;
            try {
                const data = await this.request<{ values: string[][] }>(
                    `/values/${SHEETS.HISTORIAL}!A:A`
                );
                nextRow = (data.values?.length || 5) + 1;
            } catch {
                // History sheet might not exist, start at row 6
                nextRow = 6;
            }

            const historialNumber = nextRow - 5;
            const values = [[
                historialNumber,
                activo.CodigoId,
                activo.Nombre,
                activo.Marca,
                activo.Cantidad,
                activo.Estado,
                activo.Responsable,
                activo.FechaIngreso,
                activo.Grupo,
                activo.Zona,
                activo.Observaciones,
                activo.Valoracion,
                activo.ImagenUrl,
                new Date().toISOString().split('T')[0]
            ]];

            const token = await this.getAccessToken();
            await fetch(
                `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEETS.HISTORIAL}!A${nextRow}:N${nextRow}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ values })
                }
            );
        } catch (error) {
            console.error('Error adding to history:', error);
            // Don't throw - history is secondary
        }
    }

    /**
     * Fetches all users from the Usuarios sheet
     */
    async getUsuarios(): Promise<Usuario[]> {
        const data = await this.request<{ values: string[][] }>(
            `/values/${SHEETS.USUARIOS}!A2:D`
        );

        if (!data.values || data.values.length === 0) {
            return [];
        }

        return data.values.map((row, index) => {
            const rolLetter = row[3]?.toUpperCase()?.trim();
            let rol: Usuario['Rol'];
            
            switch (rolLetter) {
                case 'Z':
                    rol = 'Prime';
                    break;
                case 'A':
                    rol = 'Admin';
                    break;
                case 'B':
                    rol = 'Usuario'; // Editor
                    break;
                case 'C':
                default:
                    rol = 'Visualizador';
            }

            console.log(`User ${row[0]}: letter="${rolLetter}" -> rol="${rol}"`);

            return {
                Id: index + 1,
                Nombre: row[2] || '',
                Email: row[0] || '',
                Password: row[1] || '',
                Rol: rol,
                Activo: true,
            };
        });
    }

    /**
     * Updates a user in the Usuarios sheet
     */
    async updateUsuario(usuario: Usuario): Promise<boolean> {
        try {
            // Convert rol back to letter
            let rolLetter: string;
            switch (usuario.Rol) {
                case 'Prime':
                    rolLetter = 'Z';
                    break;
                case 'Admin':
                    rolLetter = 'A';
                    break;
                case 'Usuario': // Editor
                    rolLetter = 'B';
                    break;
                default: // Visualizador
                    rolLetter = 'C';
            }

            const rowIndex = usuario.Id + 1; // +1 because row 1 is header
            const values = [[
                usuario.Email,
                usuario.Password,
                usuario.Nombre,
                rolLetter
            ]];

            const token = await this.getAccessToken();
            const response = await fetch(
                `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEETS.USUARIOS}!A${rowIndex}:D${rowIndex}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ values })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Gets dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const activos = await this.getActivos();

        const now = new Date();
        const fifteenDaysAgo = new Date(now);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        const estados = { Nuevo: 0, Usado: 0, Dañado: 0 };
        let valorTotal = 0;

        activos.forEach((a) => {
            if (a.Estado in estados) {
                estados[a.Estado]++;
            }
            valorTotal += a.Valoracion * a.Cantidad;
        });

        const activosRecientes = activos
            .filter((a) => {
                const fecha = new Date(a.FechaIngreso);
                return fecha >= fifteenDaysAgo;
            })
            .sort((a, b) => new Date(b.FechaIngreso).getTime() - new Date(a.FechaIngreso).getTime())
            .slice(0, 10);

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

    /**
     * Fetches deleted assets from the Historial sheet
     */
    async getHistorial(): Promise<{
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
    }[]> {
        try {
            const data = await this.request<{ values: string[][] }>(
                `/values/${SHEETS.HISTORIAL}!A6:N`
            );

            if (!data.values || data.values.length === 0) {
                return [];
            }

            return data.values
                .filter(row => row[1] && row[2]) // Filter rows with CodigoId and Nombre
                .map((row) => ({
                    Numero: parseInt(row[0]) || 0,
                    CodigoId: row[1] || '',
                    Nombre: row[2] || '',
                    Marca: row[3] || '',
                    Cantidad: parseInt(row[4]) || 0,
                    Estado: row[5] || '',
                    Responsable: row[6] || '',
                    FechaIngreso: row[7] || '',
                    Grupo: row[8] || '',
                    Zona: row[9] || '',
                    Observaciones: row[10] || '',
                    Valoracion: parseFloat(row[11]) || 0,
                    ImagenUrl: row[12] || '',
                    FechaEliminacion: row[13] || '',
                }));
        } catch (error) {
            console.error('Error fetching historial:', error);
            return [];
        }
    }

    /**
     * Adds an activity log entry
     */
    async addActivityLog(
        usuario: string,
        accion: 'LOGIN' | 'CREAR' | 'EDITAR' | 'ELIMINAR' | 'EDITAR_USUARIO',
        detalle: string
    ): Promise<void> {
        try {
            console.log(`📝 Registrando actividad: ${accion} - ${usuario} - ${detalle}`);
            
            // Get next row in logs
            let nextRow = 2;
            try {
                const data = await this.request<{ values: string[][] }>(
                    `/values/${SHEETS.LOGS}!A:A`
                );
                nextRow = (data.values?.length || 1) + 1;
                console.log(`📝 Siguiente fila en Logs: ${nextRow}`);
            } catch (e) {
                console.warn('⚠️ No se pudo obtener la última fila de Logs, usando fila 2:', e);
                nextRow = 2;
            }

            const now = new Date();
            const fecha = now.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const hora = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const values = [[
                nextRow - 1, // Número de registro
                fecha,
                hora,
                usuario,
                accion,
                detalle
            ]];

            const token = await this.getAccessToken();
            const response = await fetch(
                `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEETS.LOGS}!A${nextRow}:F${nextRow}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ values })
                }
            );

            if (response.ok) {
                console.log(`✅ Actividad registrada correctamente en fila ${nextRow}`);
            } else {
                const errorText = await response.text();
                console.error(`❌ Error al registrar actividad: ${response.status}`, errorText);
            }
        } catch (error) {
            console.error('❌ Error adding activity log:', error);
            // Don't throw - logging is secondary
        }
    }

    /**
     * Fetches activity logs
     */
    async getActivityLogs(): Promise<{
        Numero: number;
        Fecha: string;
        Hora: string;
        Usuario: string;
        Accion: string;
        Detalle: string;
    }[]> {
        try {
            const data = await this.request<{ values: string[][] }>(
                `/values/${SHEETS.LOGS}!A2:F`
            );

            if (!data.values || data.values.length === 0) {
                return [];
            }

            return data.values
                .filter(row => row[0])
                .map((row) => ({
                    Numero: parseInt(row[0]) || 0,
                    Fecha: row[1] || '',
                    Hora: row[2] || '',
                    Usuario: row[3] || '',
                    Accion: row[4] || '',
                    Detalle: row[5] || '',
                }))
                .reverse(); // Mostrar los más recientes primero
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            return [];
        }
    }
}

export const googleSheetsService = new GoogleSheetsService();
