import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = axios.create({ baseURL: '/api' });

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('trisecure-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('trisecure-token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      API.get('/auth/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('trisecure-token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('trisecure-token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, role, faceEmbeddings) => {
    const res = await API.post('/auth/register', { name, email, password, role, faceEmbeddings });
    localStorage.setItem('trisecure-token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const updateFace = async (faceEmbeddings) => {
    const res = await API.post('/auth/update-face', { faceEmbeddings });
    setUser(prev => ({ ...prev, hasFaceData: true }));
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('trisecure-token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateFace, logout, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { API };
