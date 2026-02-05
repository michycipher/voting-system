import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

// Pages
import VoterLogin from './features/voter/pages/Voterlogin';
import VotingPage from './features/voter/pages/Votingpage';
import VoteConfirmation from './features/voter/pages/Voteconfirmation';

import AdminLogin from './features/admin/pages/Adminlogin';
import AdminDashboard from './features/admin/pages/Admindashboard';
import CandidatesManagement from './features/admin/components/Candidatesmanagement';
import VotersManagement from './features/admin/pages/Votersmanagements';
import LiveResults from './features/admin/components/Liveresults';
import AuditLogs from './features/admin/components/Auditlogs';
import Settings from './features/admin/pages/Settings';

// Layouts
import VoterLayout from './features/voter/layouts/VoterLayout';
import AdminLayout from './features/admin/layouts/Adminlayout';

// Auth
import { AdminAuthProvider } from './features/admin/contexts/Adminauthcontext';
import ProtectedRoute from './features/admin/components/Protectedroute';

function App() {
  const initializeSettings = useMutation(api.settings.initialize);

  useEffect(() => {
    // Initialize default settings on first load
    initializeSettings();
  }, [initializeSettings]);

  return (
    <AdminAuthProvider>
      <Routes>
        {/* Voter Routes */}
        <Route path="/" element={<VoterLayout />}>
          <Route index element={<VoterLogin />} />
          <Route path="vote" element={<VotingPage />} />
          <Route path="confirmation" element={<VoteConfirmation />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="candidates" element={<CandidatesManagement />} />
          <Route path="voters" element={<VotersManagement />} />
          <Route path="results" element={<LiveResults />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}

export default App;