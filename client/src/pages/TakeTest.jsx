import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function TakeTest() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [test, setTest] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: { selectedOption: index, textAnswer: string } }
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [warnings, setWarnings] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Proctoring refs
    const hasStarted = useRef(false);

    useEffect(() => {
        startTest();

        // Tab switch detection
        const handleVisibilityChange = () => {
            if (document.hidden && hasStarted.current) {
                handleTabSwitch();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (timeLeft > 0 && hasStarted.current) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitTest(true); // Auto submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const handleTabSwitch = () => {
        setWarnings(prev => {
            const newWarnings = prev + 1;
            if (newWarnings >= 3) {
                alert('Maximum warnings reached. Test will be auto-submitted.');
                submitTest(true);
            } else {
                alert(`Warning ${newWarnings}/3: You are not allowed to switch tabs during the test.`);
            }
            return newWarnings;
        });
    };

    const startTest = async () => {
        try {
            const res = await api.post(`/tests/${testId}/start`);
            // Fetch full test details (questions)
            const testRes = await api.get(`/tests/${testId}`);
            setTest(testRes.data);

            // Calculate time left
            const startTime = new Date(res.data.startTime);
            const now = new Date();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const totalDurationSeconds = testRes.data.duration * 60;
            const remaining = totalDurationSeconds - elapsedSeconds;

            if (remaining <= 0) {
                // Time already up, auto submit
                setTimeLeft(0);
                submitTest(true);
            } else {
                setTimeLeft(remaining);
            }

            hasStarted.current = true;
            setLoading(false);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 400) {
                alert('You have already attempted or submitted this test.');
                navigate(`/student/dashboard/${user?.id}`);
            } else {
                alert('Failed to start test');
            }
        }
    };

    const handleAnswerChange = (questionId, value, type) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: type === 'multiple_choice'
                ? { selectedOption: value }
                : { textAnswer: value }
        }));
    };

    const submitTest = async (autoSubmitted = false) => {
        if (isSubmitting) return; // Prevent double submit
        setIsSubmitting(true);
        hasStarted.current = false; // Stop proctoring

        try {
            const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
                questionId: qId,
                ...ans
            }));

            // Use test.duration if test is available, else fallback logic needed but test should be there
            const totalTime = test ? test.duration * 60 : 0;
            const timeTaken = Math.max(0, totalTime - timeLeft);

            await api.post(`/tests/${testId}/submit`, {
                answers: formattedAnswers,
                timeTaken,
                autoSubmitted
            });

            alert(autoSubmitted ? 'Test auto-submitted.' : 'Test submitted successfully!');
            navigate(`/student/dashboard/${user?.id}`);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to submit test';
            alert(msg);
            setIsSubmitting(false); // Re-enable if failure (though navigate usually happens)
        }
    };

    if (loading) return <div className="p-8 text-center">Loading test...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 select-none"> {/* Disable text selection */}
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    <div className="text-xl font-mono font-bold text-red-600">
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                </div>

                <div className="mb-4 bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800">
                    <strong>Warning:</strong> Do not switch tabs. You have {3 - warnings} warnings remaining.
                </div>

                <div className="space-y-8">
                    {test.questions.map((q, i) => (
                        <div key={q._id} className="p-4 border rounded bg-gray-50">
                            <p className="font-medium text-lg mb-4">{i + 1}. {q.questionText}</p>

                            {q.questionType === 'multiple_choice' ? (
                                <div className="space-y-2">
                                    {q.options.map((opt, j) => (
                                        <label key={j} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-100 cursor-pointer bg-white">
                                            <input
                                                type="radio"
                                                name={q._id}
                                                checked={answers[q._id]?.selectedOption === j}
                                                onChange={() => handleAnswerChange(q._id, j, 'multiple_choice')}
                                                className="w-4 h-4"
                                            />
                                            <span>{opt.text}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded"
                                        placeholder="Type your answer here..."
                                        value={answers[q._id]?.textAnswer || ''}
                                        onChange={(e) => handleAnswerChange(q._id, e.target.value, 'fill_in_blank')}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t">
                    <button
                        disabled={isSubmitting}
                        onClick={() => {
                            if (window.confirm('Are you sure you want to submit?')) {
                                submitTest();
                            }
                        }}
                        className={`w-full text-white py-3 rounded-lg font-bold shadow-md ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                </div>
            </div>
        </div>
    );
}
