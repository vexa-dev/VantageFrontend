import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Backlog from './pages/Backlog';
import Sprints from './pages/Sprints';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import MainLayout from './components/MainLayout';
import { useAuthStore } from './store/authStore';
import type { JSX } from 'react';

// Componente para proteger rutas privadas
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

        {/* Rutas Privadas con Layout */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/sprints" element={<Sprints />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Cualquier ruta desconocida va al login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;