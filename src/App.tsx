import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import PortalPage from './pages/PortalPage';
import PerformancePage from './pages/PerformancePage';
import OnboardingPage from './pages/OnboardingPage';
import PHCPage from './pages/PHCPage';
import { Toaster } from './components/ui/toaster';
import '../src/styles/global.css';
import SkillsPage from './pages/SkillPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/portal" element={<PortalPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/phc" element={<PHCPage />} />
              <Route path="/skills" element={<SkillsPage />} />
            </Routes>
          </main>
          <footer className="bg-gray-100 dark:bg-gray-800 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} SSI Training Portal. All rights reserved.
          </footer>
        </div>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;