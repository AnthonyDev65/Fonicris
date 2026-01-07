import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';

interface AuthState {
    user: Usuario | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    // Import dynamically to avoid circular dependencies
                    const { googleSheetsService } = await import('../services/GoogleSheetsService');
                    const users = await googleSheetsService.getUsuarios();

                    const user = users.find(
                        (u) => u.Email.toLowerCase() === email.toLowerCase() && u.Password === password && u.Activo
                    );

                    if (user) {
                        set({ user, isAuthenticated: true, isLoading: false });
                        return true;
                    } else {
                        set({ error: 'Credenciales inválidas o usuario inactivo', isLoading: false });
                        return false;
                    }
                } catch (error) {
                    set({ error: 'Error al conectar con el servidor', isLoading: false });
                    console.error('Login error:', error);
                    return false;
                }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false, error: null });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'fonicris-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
