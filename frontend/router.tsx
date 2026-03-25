import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

import LandingPage from './components/screens/LandingPage';
import SelectorDeModo from './components/screens/SelectorDeModo';
import MapaDeExpediciones from './components/screens/MapaDeExpediciones';
import PanelDelTutor from './components/screens/PanelDelTutor';
import App from './App';

const Router: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/mode" element={<SelectorDeModo />} />

      {/* Student */}
      <Route path="/student/missions" element={<MapaDeExpediciones />} />
      <Route path="/session" element={<App />} />

      {/* Teacher / Parent */}
      <Route path="/teacher/panel" element={<PanelDelTutor />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default Router;
