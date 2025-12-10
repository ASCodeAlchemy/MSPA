import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateTest from './pages/CreateTest';
import AddQuestions from './pages/AddQuestions';
import StudentDashboard from './pages/StudentDashboard';
import TakeTest from './pages/TakeTest';
import TestResults from './pages/TestResults';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? `/teacher/dashboard/${user.id}` : `/student/dashboard/${user.id}`} />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard/:id" element={
        <PrivateRoute role="teacher">
          <TeacherDashboard />
        </PrivateRoute>
      } />
      {/* Redirect old path for backward compatibility or direct access */}
      <Route path="/teacher" element={<Navigate to="/login" />} />

      <Route path="/create-test" element={
        <PrivateRoute role="teacher">
          <CreateTest />
        </PrivateRoute>
      } />
      <Route path="/test/:testId/questions" element={
        <PrivateRoute role="teacher">
          <AddQuestions />
        </PrivateRoute>
      } />
      <Route path="/test/:testId/results" element={
        <PrivateRoute role="teacher">
          <TestResults />
        </PrivateRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/dashboard/:id" element={
        <PrivateRoute role="student">
          <StudentDashboard />
        </PrivateRoute>
      } />
      {/* Redirect old path */}
      <Route path="/student" element={<Navigate to="/login" />} />
      <Route path="/take-test/:testId" element={
        <PrivateRoute role="student">
          <TakeTest />
        </PrivateRoute>
      } />

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
