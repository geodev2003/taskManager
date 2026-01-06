import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();

  // Kiểm tra cả token và user
  const hasToken = authService.isAuthenticated();
  const isAuth = isAuthenticated && hasToken && user;

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/tasks" replace />;
  }

  return children;
};

export default ProtectedRoute;

