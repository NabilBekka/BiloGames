'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  // Login classique email/password
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  // Register classique email/password (email_verified = false)
  const register = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  // Étape 1 Google: Vérifier le token et récupérer les infos
  // Retourne soit l'utilisateur connecté, soit les données Google pour le formulaire
  const googleAuth = async (credential) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, { credential });
      
      if (res.data.isExistingUser) {
        // Utilisateur existant - connexion directe
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        return { success: true, isExistingUser: true };
      } else {
        // Nouvel utilisateur - retourner les données Google pour le formulaire
        return { 
          success: true, 
          isExistingUser: false, 
          googleData: res.data.googleData 
        };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Google login failed' };
    }
  };

  // Étape 2 Google: Créer le compte avec toutes les infos (email_verified = true)
  const googleRegister = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google/register`, data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create account' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Update user profile
  const updateUser = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/auth/update`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Update failed' };
    }
  };

  // Delete account
  const deleteAccount = async (password) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password }
      });
      localStorage.removeItem('token');
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Delete failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      googleAuth,
      googleRegister,
      updateUser,
      deleteAccount,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
