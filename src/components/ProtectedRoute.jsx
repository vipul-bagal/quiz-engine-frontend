import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Logged in, but wrong role for this area — send them to their own home.
    return <Navigate to={user.role === 'INSTRUCTOR' ? '/instructor' : '/student'} replace />;
  }

  return children;
}
