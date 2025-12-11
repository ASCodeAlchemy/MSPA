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
            const token = localStorage.getItem('token');

            if (token) {
                // Set header before fetching
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Fetch fresh user data
                const res = await api.get('/auth/me');
                const freshUser = res.data.user;

                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
            } else {
                // Fallback to purely stored user if offline or logic requires
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            }
        } catch (error) {
            console.error("Check user failed:", error);
            // If token is invalid, clear session
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        setUser(res.data.user);

        // Store token in localStorage
        if (res.data.accessToken) {
            localStorage.setItem('token', res.data.accessToken);
            if (res.data.refreshToken) {
                localStorage.setItem('refreshToken', res.data.refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(res.data.user));
            // Set header for subsequent requests
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
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
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser: checkUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
