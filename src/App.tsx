import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';

// Lazy placeholders – to be implemented
import { lazy, Suspense } from 'react';
const Modul = lazy(() => import('./pages/Modul'));
const DetailModul = lazy(() => import('./pages/DetailModul'));
const Profil = lazy(() => import('./pages/Profil'));
const Lainnya = lazy(() => import('./pages/Lainnya'));
const Admin = lazy(() => import('./pages/Admin'));
const HasilAjar = lazy(() => import('./pages/HasilAjar'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* ── Teacher Protected ── */}
            <Route path="/home" element={
              <ProtectedRoute><DashboardLayout><Home /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/modul" element={
              <ProtectedRoute><DashboardLayout><Modul /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/profil" element={
              <ProtectedRoute><DashboardLayout><Profil /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/lainnya" element={
              <ProtectedRoute><DashboardLayout><Lainnya /></DashboardLayout></ProtectedRoute>
            } />
            <Route path="/hasil-ajar" element={
              <ProtectedRoute><DashboardLayout><HasilAjar /></DashboardLayout></ProtectedRoute>
            } />

            {/* Detail Modul accessible by guests too (they arrive via code) */}
            <Route path="/detail-modul/:id" element={<DetailModul />} />

            {/* ── Admin Only ── */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
