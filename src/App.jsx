import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InstructorHome from './pages/instructor/InstructorHome';
import GenerateQuiz from './pages/instructor/GenerateQuiz';
import MyQuestions from './pages/instructor/MyQuestions';
import Analytics from './pages/instructor/Analytics';
import Courses from './pages/instructor/Courses';
import Students from './pages/instructor/Students';
import MixQuiz from './pages/instructor/MixQuiz';
import StudentHome from './pages/student/StudentHome';
import TakeQuiz from './pages/student/TakeQuiz';
import ResultsList from './pages/student/ResultsList';
import Results from './pages/student/Results';

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'INSTRUCTOR' ? '/instructor' : '/student'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/instructor" element={<ProtectedRoute allowedRole="INSTRUCTOR"><InstructorHome /></ProtectedRoute>} />
        <Route path="/instructor/courses" element={<ProtectedRoute allowedRole="INSTRUCTOR"><Courses /></ProtectedRoute>} />
        <Route path="/instructor/generate" element={<ProtectedRoute allowedRole="INSTRUCTOR"><GenerateQuiz /></ProtectedRoute>} />
        <Route path="/instructor/questions" element={<ProtectedRoute allowedRole="INSTRUCTOR"><MyQuestions /></ProtectedRoute>} />
        <Route path="/instructor/mix-quiz" element={<ProtectedRoute allowedRole="INSTRUCTOR"><MixQuiz /></ProtectedRoute>} />
        <Route path="/instructor/students" element={<ProtectedRoute allowedRole="INSTRUCTOR"><Students /></ProtectedRoute>} />
        <Route path="/instructor/analytics" element={<ProtectedRoute allowedRole="INSTRUCTOR"><Analytics /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute allowedRole="STUDENT"><StudentHome /></ProtectedRoute>} />
        <Route path="/student/take-quiz/:sessionId" element={<ProtectedRoute allowedRole="STUDENT"><TakeQuiz /></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute allowedRole="STUDENT"><ResultsList /></ProtectedRoute>} />
        <Route path="/student/results/:sessionId" element={<ProtectedRoute allowedRole="STUDENT"><Results /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
