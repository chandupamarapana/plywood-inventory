import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Consumables from './pages/Consumables';
import Engineering from './pages/Engineering';
import ActivityLog from './pages/ActivityLog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="consumables" element={<Consumables />} />
          <Route path="engineering" element={<Engineering />} />
          <Route path="activity" element={<ActivityLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;