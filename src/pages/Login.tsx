import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, X } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        const success = await login(email, password);
        if (success) {
            navigate('/');
        }
    };

    const isFormValid = email.trim() !== '' && password.trim() !== '';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200">
            {/* Login Card - Inspired by WPF design */}
            <div className="w-full max-w-[400px] bg-[#F4F4F4] rounded-xl shadow-lg border border-gray-300/50 overflow-hidden">
                {/* Header */}
                <div className="relative h-[70px] flex items-center px-8 border-b-[3px] border-white">
                    <h1 className="text-2xl font-semibold text-[#2C3E50] font-['Montserrat',sans-serif]">
                        Log in
                    </h1>
                    
                    {/* Close button - decorative for web */}
                    <button 
                        className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-500 group"
                        onClick={() => window.close()}
                    >
                        <X className="w-4 h-4 text-[#2C3E50] group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Form Section */}
                <div className="p-8 pt-6 border-t-[3px] border-white">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="relative">
                            <div className={`
                                h-[50px] rounded-lg bg-[#F8F8FC] border transition-all
                                ${email ? 'border-[#8A2BE2] bg-white' : 'border-[#E0E0E0] hover:border-[#C0C0C0]'}
                            `}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-full px-4 bg-transparent text-black text-base font-['Montserrat',sans-serif] outline-none"
                                    placeholder=""
                                    required
                                    autoComplete="email"
                                />
                                {!email && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-['Montserrat',sans-serif] pointer-events-none">
                                        E-mail
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="relative">
                            <div className={`
                                h-[50px] rounded-lg bg-[#F8F8FC] border transition-all
                                ${password ? 'border-black bg-white' : 'border-[#E0E0E0] hover:border-[#C0C0C0]'}
                            `}>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-full px-4 bg-transparent text-black text-base font-['Montserrat',sans-serif] outline-none"
                                    placeholder=""
                                    required
                                    autoComplete="current-password"
                                />
                                {!password && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-['Montserrat',sans-serif] pointer-events-none">
                                        Password
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isLoading}
                            className={`
                                w-[200px] h-[50px] mx-auto block rounded-[10px] text-white text-base font-bold font-['Montserrat',sans-serif]
                                transition-all shadow-md
                                ${isFormValid && !isLoading 
                                    ? 'bg-[#1E90FF] hover:bg-blue-600 cursor-pointer' 
                                    : 'bg-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verificando...
                                </span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>

                        {/* Loading Panel */}
                        {isLoading && (
                            <div className="bg-[#F8F9FA] rounded p-5 text-center animate-fade-in">
                                <div className="w-[200px] h-1 bg-[#ECF0F1] rounded-full mx-auto overflow-hidden">
                                    <div className="h-full bg-[#3498DB] animate-pulse rounded-full" style={{ width: '60%' }} />
                                </div>
                                <p className="text-[#7F8C8D] text-xs mt-3">Verificando credenciales...</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer - Error Message */}
                <div className="h-[70px] border-t-[3px] border-white flex items-center justify-center px-8">
                    {error && (
                        <p className="text-[#E74C3C] text-sm text-center animate-fade-in">
                            {error}
                        </p>
                    )}
                </div>
            </div>

            {/* Branding */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center">
                <p className="text-gray-500 text-sm font-['Montserrat',sans-serif]">
                    <span className="font-bold text-[#2C3E50]">FONICRIS</span> - Sistema de Gestión de Inventario
                </p>
                <p className="text-gray-400 text-xs mt-1">© 2026 Todos los derechos reservados</p>
            </div>
        </div>
    );
}
