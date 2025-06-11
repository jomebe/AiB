import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Main from './components/pages/Main';
import Classic from './components/pages/Classic';
import Arcade from './components/pages/Arcade';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/classic" element={<Classic />} />
        <Route path="/arcade" element={<Arcade />} />
      </Routes>
    </Router>
  );
}

export default App;
