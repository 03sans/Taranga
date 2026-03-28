import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentLogin from './pages/StudentLogin';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

import UserManagement from './pages/UserManagement';
import StudentManagement from './pages/StudentManagement';
import Profile from './pages/Profile';
import AdaptiveScreening from './pages/AdaptiveScreening';
import NLPObservation from './pages/NLPObservation';
import ScreeningResults from './pages/ScreeningResults';
import StudentActivity from './pages/StudentActivity';
import ProgressTracking from './pages/ProgressTracking';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-login" element={<StudentLogin />} />
        
        {/* Dashboards */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />

        {/* Management & Profiles */}
        <Route path="/users" element={<UserManagement />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/profile" element={<Profile />} />

        {/* Screening Core UX */}
        <Route path="/screening/adaptive" element={<AdaptiveScreening />} />
        <Route path="/screening/nlp" element={<NLPObservation />} />

        {/* Results & Analytics */}
        <Route path="/results/:id" element={<ScreeningResults />} />
        <Route path="/analytics" element={<ProgressTracking />} />

        {/* Interventions */}
        <Route path="/activity/:id" element={<StudentActivity />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
