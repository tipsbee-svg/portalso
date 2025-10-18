import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabaseClient';
import { useAuthStore } from './store/authStore';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Chat from './pages/Chat';
import AdminDashboard from './pages/admin/AdminDashboard';
import Abbreviations from './pages/admin/Abbreviations';
import SystemLogs from './pages/admin/SystemLogs';
import PendingApproval from './pages/PendingApproval';
import NotFound from './pages/NotFound';
import Spinner from './components/ui/Spinner';
import AdminAuthority from './pages/AdminAuthority';

function App() {
  const { setSession, setProfile, session, isInitialized, setInitialized } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          // FIX: Property 'catch' does not exist on type 'PromiseLike<void>'.
          // Refactored to handle data and error in a single .then() callback and ensure setInitialized is always called.
          .then(({ data, error }) => {
            if (error) {
              console.error("Error fetching profile on initial load:", error);
            } else {
              setProfile(data);
            }
            setInitialized(true);
          });
      } else {
        setInitialized(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
         supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
          })
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-navy-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        className: 'font-sans',
        style: {
          background: '#312e81',
          color: '#eef2ff'
        }
      }} />
      <HashRouter>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={session ? <Navigate to="/" /> : <Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="directory" element={<Directory />} />
              <Route path="authority" element={<AdminAuthority />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:id" element={<Chat />} />
              
              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="abbreviations" element={<Abbreviations />} />
              <Route path="logs" element={<SystemLogs />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;