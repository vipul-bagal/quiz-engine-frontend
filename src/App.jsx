import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InstructorHome from './pages/instructor/InstructorHome';
import GenerateQuiz from './pages/instructor/GenerateQuiz';
import MyQuestions from './pages/instructor/MyQuestions';
import Analytics from './pages/instructor/Analytics';
import StudentHome from './pages/student/StudentHome';

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

        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRole="INSTRUCTOR">
              <InstructorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/generate"
          element={
            <ProtectedRoute allowedRole="INSTRUCTOR">
              <GenerateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/questions"
          element={
            <ProtectedRoute allowedRole="INSTRUCTOR">
              <MyQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/analytics"
          element={
            <ProtectedRoute allowedRole="INSTRUCTOR">
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRole="STUDENT">
              <StudentHome />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
