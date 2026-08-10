import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import InstructorHome from './pages/instructor/InstructorHome';
import GenerateQuiz from './pages/instructor/GenerateQuiz';
import Analytics from './pages/instructor/Analytics';
import Courses from './pages/instructor/Courses';
import InstructorCourseDetail from './pages/instructor/CourseDetail';
import QuizDetail from './pages/instructor/QuizDetail';
import Students from './pages/instructor/Students';
import StudentDetail from './pages/instructor/StudentDetail';
import MixQuiz from './pages/instructor/MixQuiz';
import Approvals from './pages/instructor/Approvals';
import BrowseAll from './pages/instructor/BrowseAll';
import StudentHome from './pages/student/StudentHome';
import Practice from './pages/student/Practice';
import BrowseCourses from './pages/student/BrowseCourses';
import StudentCourseDetail from './pages/student/CourseDetail';
import TakeQuiz from './pages/student/TakeQuiz';
import ResultsList from './pages/student/ResultsList';
import Results from './pages/student/Results';
import SessionReview from './pages/student/SessionReview';

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
        <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedRole="INSTRUCTOR"><InstructorCourseDetail /></ProtectedRoute>} />
        <Route path="/instructor/quiz/:id" element={<ProtectedRoute allowedRole="INSTRUCTOR"><QuizDetail /></ProtectedRoute>} />
        <Route path="/instructor/generate" element={<ProtectedRoute allowedRole="INSTRUCTOR"><GenerateQuiz /></ProtectedRoute>} />
        <Route path="/instructor/mix-quiz" element={<ProtectedRoute allowedRole="INSTRUCTOR"><MixQuiz /></ProtectedRoute>} />
        <Route path="/instructor/students" element={<ProtectedRoute allowedRole="INSTRUCTOR"><Students /></ProtectedRoute>} />
        <Route path="/instructor/students/:studentId" element={<ProtectedRoute allowedRole="INSTRUCTOR"><StudentDetail /></ProtectedRoute>} />
        <Route path="/instructor/analytics" element={<ProtectedRoute allowedRole="INSTRUCTOR"><Analytics /></ProtectedRoute>} />
        <Route path="/instructor/approvals" element={<ProtectedRoute allowedRole="INSTRUCTOR"><Approvals /></ProtectedRoute>} />
        <Route path="/instructor/browse" element={<ProtectedRoute allowedRole="INSTRUCTOR"><BrowseAll /></ProtectedRoute>} />

        <Route path="/student" element={<ProtectedRoute allowedRole="STUDENT"><StudentHome /></ProtectedRoute>} />
        <Route path="/student/courses" element={<ProtectedRoute allowedRole="STUDENT"><BrowseCourses /></ProtectedRoute>} />
        <Route path="/student/courses/:courseId" element={<ProtectedRoute allowedRole="STUDENT"><StudentCourseDetail /></ProtectedRoute>} />
        <Route path="/student/practice" element={<ProtectedRoute allowedRole="STUDENT"><Practice /></ProtectedRoute>} />
        <Route path="/student/take-quiz/:sessionId" element={<ProtectedRoute allowedRole="STUDENT"><TakeQuiz /></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute allowedRole="STUDENT"><ResultsList /></ProtectedRoute>} />
        <Route path="/student/results/:sessionId" element={<ProtectedRoute allowedRole="STUDENT"><Results /></ProtectedRoute>} />
        <Route path="/student/review/:sessionId" element={<ProtectedRoute allowedRole="STUDENT"><SessionReview /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
