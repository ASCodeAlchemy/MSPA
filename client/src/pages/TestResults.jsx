import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function TestResults() {
    const { testId } = useParams();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testTitle, setTestTitle] = useState('');

    useEffect(() => {
        fetchResults();
    }, [testId]);

    const fetchResults = async () => {
        try {
            const res = await api.get(`/results/test/${testId}`);
            setResults(res.data);
            if (res.data.length > 0) {
                setTestTitle(res.data[0].test.title);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Loading results...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to="/teacher" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">&larr; Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold text-gray-800">Results: {testTitle || 'Test Results'}</h1>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No results found for this test yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-700">Student Name</th>
                                        <th className="p-4 font-semibold text-gray-700">Email</th>
                                        <th className="p-4 font-semibold text-gray-700">Score</th>
                                        <th className="p-4 font-semibold text-gray-700">Percentage</th>
                                        <th className="p-4 font-semibold text-gray-700">Time Taken</th>
                                        <th className="p-4 font-semibold text-gray-700">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result) => (
                                        <tr key={result._id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{result.student?.name || 'Unknown'}</td>
                                            <td className="p-4 text-gray-600">{result.student?.email || 'N/A'}</td>
                                            <td className="p-4 font-bold text-blue-600">{result.score} / {result.totalMarks}</td>
                                            <td className="p-4 text-gray-800">{result.percentage.toFixed(1)}%</td>
                                            <td className="p-4 text-gray-600">
                                                {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                                            </td>
                                            <td className="p-4 text-gray-500 text-sm">
                                                {new Date(result.submittedAt || result.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
