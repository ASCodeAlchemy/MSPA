import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AddQuestions() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);

    // New Question State
    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState('multiple_choice');
    const [options, setOptions] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [marks, setMarks] = useState(1);

    useEffect(() => {
        fetchTest();
    }, [testId]);

    const fetchTest = async () => {
        try {
            const res = await api.get(`/tests/${testId}`);
            setTest(res.data);
            setQuestions(res.data.questions || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '', isCorrect: false }]);
    };

    const removeOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                questionText,
                questionType,
                marks,
                testId // Pass testId if needed by backend to link immediately, 
                // BUT current backend creates question first, then we need to link it to test.
                // Wait, the backend `POST /questions` creates a question but doesn't link it to a test automatically?
                // Let's check `tests.js` or `questions.js`.
                // `POST /questions` just creates it.
                // `PUT /tests/:id` can update questions array.
                // So I need to: 1. Create Question, 2. Add Question ID to Test.
            };

            if (questionType === 'fill_in_blank') {
                payload.correctAnswer = correctAnswer;
            } else {
                payload.options = options;
            }

            // 1. Create Question
            const qRes = await api.post('/questions', payload);
            const newQuestionId = qRes.data._id;

            // 2. Update Test
            const updatedQuestions = [...questions.map(q => q._id), newQuestionId];
            await api.put(`/tests/${testId}`, { questions: updatedQuestions });

            // Reset form
            setQuestionText('');
            setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
            setCorrectAnswer('');
            fetchTest(); // Refresh list
        } catch (error) {
            console.error(error);
            alert('Failed to add question');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Add Questions to: {test?.title}</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate(`/teacher/dashboard/${user?.id}`)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await api.put(`/tests/${testId}/publish`);
                                    alert('Test published successfully!');
                                    navigate(`/teacher/dashboard/${user?.id}`);
                                } catch (error) {
                                    console.error(error);
                                    alert('Failed to publish test');
                                }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Publish Test
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Question Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">New Question</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Question Text</label>
                                <textarea
                                    className="w-full p-2 border rounded"
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Type</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value)}
                                >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="fill_in_blank">Fill in the Blank</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Marks</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={marks}
                                    onChange={(e) => setMarks(e.target.value)}
                                    min="1"
                                />
                            </div>

                            {questionType === 'multiple_choice' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Options</label>
                                    {options.map((option, index) => (
                                        <div key={index} className="flex gap-2 mb-2 items-center">
                                            <input
                                                type="radio"
                                                name="correctOption"
                                                checked={option.isCorrect}
                                                onChange={() => {
                                                    const newOptions = options.map((o, i) => ({ ...o, isCorrect: i === index }));
                                                    setOptions(newOptions);
                                                }}
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 p-2 border rounded"
                                                value={option.text}
                                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                                placeholder={`Option ${index + 1}`}
                                                required
                                            />
                                            {options.length > 2 && (
                                                <button type="button" onClick={() => removeOption(index)} className="text-red-500">X</button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={addOption} className="text-sm text-blue-600 hover:underline">+ Add Option</button>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Correct Answer</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        required
                                        placeholder="Enter the correct answer"
                                    />
                                </div>
                            )}

                            <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                                Add Question
                            </button>
                        </form>
                    </div>

                    {/* Existing Questions List */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Existing Questions ({questions.length})</h2>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {questions.map((q, i) => (
                                <div key={q._id} className="p-4 border rounded bg-gray-50">
                                    <p className="font-medium">Q{i + 1}: {q.questionText}</p>
                                    <p className="text-sm text-gray-500 mt-1">Type: {q.questionType}</p>
                                    {q.questionType === 'multiple_choice' && (
                                        <ul className="mt-2 text-sm ml-4 list-disc">
                                            {q.options.map((opt, j) => (
                                                <li key={j} className={opt.isCorrect ? 'text-green-600 font-bold' : ''}>
                                                    {opt.text}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {q.questionType === 'fill_in_blank' && (
                                        <p className="text-sm mt-1 text-green-600">Answer: {q.correctAnswer}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
