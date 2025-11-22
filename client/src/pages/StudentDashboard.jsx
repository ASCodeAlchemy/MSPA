import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
    const [tests, setTests] = useState([]);
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await api.get('/tests/active');
            setTests(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Welcome, {user?.name}</span>
                        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4">Available Tests</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tests.map(test => (
                        <div key={test._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">{test.title}</h3>
                            <p className="text-gray-500 mb-4 text-sm">{test.description || 'No description'}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                <span>Duration: {test.duration} mins</span>
                                <span>By: {test.createdBy?.name}</span>
                            </div>
                            <Link to={`/take-test/${test._id}`} className="block w-full bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700">
                                Start Test
                            </Link>
                        </div>
                    ))}
                    {tests.length === 0 && (
                        <p className="text-gray-500 col-span-full text-center py-8">No active tests available at the moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
