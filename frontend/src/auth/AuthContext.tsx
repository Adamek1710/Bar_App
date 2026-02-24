import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { updateSocketToken } from '../api';

export interface User {
  id: number;
  username: string;
  role: 'owner' | 'employee';
  created_at: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    console.log('AuthProvider: Mounting and checking for stored token');
    const storedToken = localStorage.getItem('auth_token');
    console.log('AuthProvider: Found stored token:', !!storedToken);
    if (storedToken) {
      // Set token and axios headers immediately
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      updateSocketToken(storedToken);
      console.log('AuthProvider: Token set, verifying...');
      // Verify token is still valid
      verifyToken(storedToken);
    } else {
      console.log('AuthProvider: No token found, setting loading to false');
      setIsLoading(false);
    }
  }, []);

  // Update axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateSocketToken(token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      updateSocketToken('');
    }
  }, [token]);

  const verifyToken = async (authToken: string) => {
    console.log('AuthProvider: Verifying token...');
    try {
      const response = await axios.get('/api/auth/me');
      console.log('AuthProvider: Token verification successful:', response.data);
      setUser(response.data);
      // Token is valid, keep it in localStorage
    } catch (error) {
      console.error('AuthProvider: Token verification failed:', error);
      // Token is invalid, remove it and clear state
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      updateSocketToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { token: authToken, user: userData } = response.data;
      
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('auth_token', authToken);
      
      // Update axios defaults and socket
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      updateSocketToken(authToken);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed');
      }
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      updateSocketToken('');
    }
  };

  const isAuthenticated = !!user;
  const isOwner = user?.role === 'owner';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated,
        isOwner,
        isEmployee
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
