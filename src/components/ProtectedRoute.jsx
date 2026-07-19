import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isTokenExpired } from '../utils/jwt';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated, logout } = useAuth();

  const token = localStorage.getItem('quiz_engine_token');
  if (isAuthenticated && (!token || isTokenExpired(token))) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'INSTRUCTOR' ? '/instructor' : '/student'} replace />;
  }

  return children;
}
