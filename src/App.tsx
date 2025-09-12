import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Stats from './pages/Stats';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
          <h1>Stats Tracker</h1>
          <div>
            <a href="/" style={{ marginRight: '1rem' }}>Dashboard</a>
            <a href="/players" style={{ marginRight: '1rem' }}>Players</a>
            <a href="/stats">Stats</a>
          </div>
        </nav>
        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;