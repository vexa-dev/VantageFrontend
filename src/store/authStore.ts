import { create } from 'zustand';
import type { AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  user: { id: number; email: string; roles: string[] } | null;
  isAuthenticated: boolean;
  
  // Acciones
  setLogin: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'), // Cargar del disco al iniciar
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null,
  isAuthenticated: !!localStorage.getItem('token'),

  setLogin: (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    const userData = { id: data.id, email: data.email, roles: data.roles };
    localStorage.setItem('user', JSON.stringify(userData));
    
    set({ 
      token: data.token, 
      user: userData, 
      isAuthenticated: true 
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));