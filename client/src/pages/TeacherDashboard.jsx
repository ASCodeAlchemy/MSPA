import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
    const [tests, setTests] = useState([]);
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const res = await api.get('/tests/my-tests');
            setTests(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this test?')) {
            try {
                await api.delete(`/tests/${id}`);
                fetchTests();
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Welcome, {user?.name}</span>
                        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
                    </div>
                </div>

                <div className="mb-6">
                    <Link to="/create-test" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md inline-block">
                        + Create New Test
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tests.map(test => (
                        <div key={test._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-2 text-gray-800">{test.title}</h3>
                            <p className="text-gray-500 mb-4 text-sm">{test.description || 'No description'}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                <span>{test.questions.length} Questions</span>
                                <span>{test.duration} mins</span>
                            </div>
                            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                                <Link to={`/test/${test._id}/questions`} className="text-blue-600 hover:text-blue-800 font-medium">
                                    Manage Questions
                                </Link>
                                <button onClick={() => handleDelete(test._id)} className="text-red-500 hover:text-red-700">
                                    Delete
                                </button>
                            </div>
                            <div className="mt-2 text-center">
                                <Link to={`/test/${test._id}/results`} className="text-green-600 hover:text-green-800 text-sm font-medium">
                                    View Results
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
