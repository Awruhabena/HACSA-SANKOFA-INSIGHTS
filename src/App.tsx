import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, AdminLayout, ProtectedRoute } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Spinner } from './components/ui';

// Public pages — loaded eagerly (must stay small for mobile data)
import Register from './pages/public/Register';
import RegisterDone from './pages/public/RegisterDone';
import Feedback from './pages/public/Feedback';
import FeedbackDone from './pages/public/FeedbackDone';
import NotFound from './pages/public/NotFound';

// Admin pages — lazy loaded (only needed for authenticated staff)
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const EventList = lazy(() => import('./pages/admin/EventList'));
const EventNew = lazy(() => import('./pages/admin/EventNew'));
const EventDetail = lazy(() => import('./pages/admin/EventDetail'));

function AdminSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20">
          <Spinner className="h-8 w-8 text-clay" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/register/:eventSlug" element={<Register />} />
            <Route path="/register/:eventSlug/done" element={<RegisterDone />} />
            <Route path="/feedback/:eventSlug" element={<Feedback />} />
            <Route path="/feedback/:eventSlug/done" element={<FeedbackDone />} />
          </Route>

          {/* Admin login (not protected, lazy loaded) */}
          <Route
            path="/admin/login"
            element={
              <AdminSuspense>
                <Login />
              </AdminSuspense>
            }
          />

          {/* Admin routes (protected, lazy loaded) */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/admin/dashboard"
              element={
                <AdminSuspense>
                  <Dashboard />
                </AdminSuspense>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AdminSuspense>
                  <EventList />
                </AdminSuspense>
              }
            />
            <Route
              path="/admin/events/new"
              element={
                <AdminSuspense>
                  <EventNew />
                </AdminSuspense>
              }
            />
            <Route
              path="/admin/events/:id"
              element={
                <AdminSuspense>
                  <EventDetail />
                </AdminSuspense>
              }
            />
          </Route>

          {/* Redirects and catch-all */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
