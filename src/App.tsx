import { Routes, Route, Navigate } from 'react-router-dom';
import PageShell from './components/layout/PageShell';
import Home from './pages/Home';
import Search from './pages/Search';
import RecordPage from './pages/Record';
import Submit from './pages/Submit';
import Dispute from './pages/Dispute';
import About from './pages/About';
import AdminGuard from './components/admin/AdminGuard';
import AdminShell from './components/admin/AdminShell';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminRecords from './pages/admin/AdminRecords';

export default function App() {
  return (
    <Routes>
      <Route element={<PageShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/record/:id" element={<RecordPage />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/dispute" element={<Dispute />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="/admin">
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminShell />}>
            <Route index element={<AdminDashboard />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="records" element={<AdminRecords />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
