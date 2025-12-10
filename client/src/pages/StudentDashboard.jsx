import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
    const [tests, setTests] = useState([]);
    const { user, logout, refreshUser } = useAuth();

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

    const [enrollCode, setEnrollCode] = useState('');
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollError, setEnrollError] = useState('');
    const [enrollSuccess, setEnrollSuccess] = useState('');

    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users/enroll', { code: enrollCode });
            const teacherName = res.data.teacher?.name;
            setEnrollSuccess(teacherName ? `Successfully enrolled with ${teacherName}!` : 'Successfully enrolled!');
            setEnrollError('');
            setEnrollCode('');
            setTimeout(async () => {
                setShowEnrollModal(false);
                setEnrollSuccess('');
                await refreshUser(); // Update user to get new enrolledTeachers list
                fetchTests();
            }, 1000);
        } catch (error) {
            setEnrollError(error.response?.data?.message || 'Enrollment failed');
            setEnrollSuccess('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Welcome, {user?.name}</span>
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                        >
                            Enroll with Teacher
                        </button>
                        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
                    </div>
                </div>

                {showEnrollModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl shadow-lg w-96">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Enroll with Teacher</h2>
                            <form onSubmit={handleEnroll}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Teacher Code</label>
                                    <input
                                        type="text"
                                        value={enrollCode}
                                        onChange={(e) => setEnrollCode(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter 4-digit code"
                                        maxLength={4}
                                        required
                                    />
                                </div>
                                {enrollError && <p className="text-red-500 text-sm mb-4">{enrollError}</p>}
                                {enrollSuccess && <p className="text-green-500 text-sm mb-4">{enrollSuccess}</p>}
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEnrollModal(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Enroll
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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
                        <p className="text-gray-500 col-span-full text-center py-8">
                            No active tests available. {user?.enrolledTeachers?.length === 0 ? "You haven't enrolled with any teachers yet." : ""}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
