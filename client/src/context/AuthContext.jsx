import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            // Assuming there's an endpoint to get current user, if not we might need to rely on local storage or add one
            // Check sessionStorage
            const storedUser = sessionStorage.getItem('user');
            const token = sessionStorage.getItem('token');

            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        setUser(res.data.user);

        // Store token in sessionStorage for per-tab isolation
        if (res.data.token) {
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
            // Set header for subsequent requests
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        }

        return res.data;
    };

    const register = async (name, email, password, role) => {
        const res = await api.post('/auth/register', { name, email, password, role });
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error(err);
        }
        setUser(null);
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
