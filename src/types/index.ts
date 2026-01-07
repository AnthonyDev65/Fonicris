// Asset (Activo) Interface
export interface Activo {
    Numero: number;
    CodigoId: string;
    Nombre: string;
    Marca: string;
    Cantidad: number;
    Estado: 'Nuevo' | 'Usado' | 'Dañado';
    Responsable: string;
    FechaIngreso: string; // ISO Format
    Grupo: string;
    Zona: string;
    Observaciones: string;
    Valoracion: number;
    ImagenUrl: string;
}

// User Interface
export interface Usuario {
    Id: number;
    Nombre: string;
    Email: string;
    Password: string;
    Rol: 'Admin' | 'Usuario' | 'Visualizador';
    Activo: boolean;
}

// Filter State
export interface FilterState {
    search: string;
    grupo: string[];
    zona: string[];
    estado: string[];
}

// Dashboard Stats
export interface DashboardStats {
    totalActivos: number;
    activosNuevos: number;
    activosUsados: number;
    activosDanados: number;
    valorTotal: number;
    activosRecientes: Activo[];
    activosPorDia: { fecha: string; cantidad: number }[];
}
