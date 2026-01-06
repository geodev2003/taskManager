import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Import các components
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import KanbanBoard from './pages/KanbanBoard';
import ProductivityDashboard from './pages/ProductivityDashboard';
import DeletedTasks from './pages/DeletedTasks';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route (chỉ cho phép khi chưa login)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/tasks" replace />;
};

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider BÊN TRONG BrowserRouter */}
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/new"
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <TaskDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id/edit"
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kanban"
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <ProductivityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/deleted"
            element={
              <ProtectedRoute>
                <DeletedTasks />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/tasks" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;