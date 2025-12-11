import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateTest() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(30);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/tests', { title, description, duration, questions: [] });
            navigate(`/test/${res.data._id}/questions`);
        } catch (error) {
            console.error(error);
            alert('Failed to create test. Ensure backend allows empty questions or add one.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md h-fit">
                <button
                    onClick={() => navigate(`/teacher/dashboard/${user?.id}`)}
                    className="mb-4 text-blue-600 hover:text-blue-800"
                >
                    &larr; Back to Dashboard
                </button>
                <h2 className="text-2xl font-bold mb-6">Create New Test</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Description</label>
                        <textarea
                            className="w-full p-2 border rounded"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Duration (minutes)</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            required
                            min="1"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Create & Add Questions
                    </button>
                </form>
            </div>
        </div>
    );
}
