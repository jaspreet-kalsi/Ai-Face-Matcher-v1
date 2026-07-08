import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Enrollment from './pages/Enrollment';
import LiveMatcher from './pages/LiveMatcher';
import History from './pages/History';

function App() {
  return (
    <Router>
      <header className="app-header">
        <div className="logo">AI Face Matcher</div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/enroll" element={<Enrollment />} />
          <Route path="/match" element={<LiveMatcher />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
