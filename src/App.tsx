import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Colaboradores from './pages/Colaboradores';
import Historial from './pages/Historial';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function PrimeRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Only Prime users (Z) can access
    if (user?.Rol !== 'Prime') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function PrimeOrAdminRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Prime (Z) or Admin (A) can access
    if (user?.Rol !== 'Prime' && user?.Rol !== 'Admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function App() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="inventario" element={<Inventory />} />
                <Route 
                    path="colaboradores" 
                    element={
                        <PrimeOrAdminRoute>
                            <Colaboradores />
                        </PrimeOrAdminRoute>
                    } 
                />
                <Route 
                    path="historial" 
                    element={
                        <PrimeRoute>
                            <Historial />
                        </PrimeRoute>
                    } 
                />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
