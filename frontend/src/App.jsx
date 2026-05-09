import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceHistory from './pages/AttendanceHistory';
import AdminDashboard from './pages/AdminDashboard';
import ManageClassrooms from './pages/ManageClassrooms';
import ManageTimeSlots from './pages/ManageTimeSlots';
import ManageStudents from './pages/ManageStudents';
import AdminAttendance from './pages/AdminAttendance';
import EnrollStudents from './pages/EnrollStudents';
import FaceEnrollStation from './pages/FaceEnrollStation';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  return children;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen message="Initializing TriSecure..." />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
        <Route path="/enroll" element={<FaceEnrollStation />} />

        {/* Student */}
        <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/mark-attendance" element={<ProtectedRoute role="student"><MarkAttendance /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute role="student"><AttendanceHistory /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/classrooms" element={<ProtectedRoute role="admin"><ManageClassrooms /></ProtectedRoute>} />
        <Route path="/admin/timeslots" element={<ProtectedRoute role="admin"><ManageTimeSlots /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute role="admin"><ManageStudents /></ProtectedRoute>} />
        <Route path="/admin/enroll" element={<ProtectedRoute role="admin"><EnrollStudents /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><AdminAttendance /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#e2e8f0', borderRadius: '12px', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
