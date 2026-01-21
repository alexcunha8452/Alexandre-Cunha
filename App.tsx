import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Maintenance from './pages/Maintenance';
import Financial from './pages/Financial';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/veiculos" element={<Vehicles />} />
            <Route path="/manutencao" element={<Maintenance />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/despesas" element={<Expenses />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;