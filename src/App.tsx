import { Routes, Route } from 'react-router-dom';
import PageShell from './components/layout/PageShell';
import Home from './pages/Home';
import Search from './pages/Search';
import RecordPage from './pages/Record';
import Submit from './pages/Submit';
import Dispute from './pages/Dispute';
import About from './pages/About';

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
    </Routes>
  );
}
