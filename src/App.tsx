import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { useAuthStore } from './store/authStore';
import type { JSX } from 'react';

// Componente para proteger rutas privadas
// Si no estás logueado, te patea al Login
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter> 
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<Login />} />

        {/* Ruta Privada (Dashboard) - Por ahora un texto simple */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <h1 style={{ textAlign: 'center', marginTop: 50 }}>
                🚀 Bienvenido al Dashboard de Vantage
              </h1>
            </PrivateRoute>
          }
        />
        
        {/* Cualquier ruta desconocida va al login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;