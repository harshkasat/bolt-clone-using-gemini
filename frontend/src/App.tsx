import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Builder } from './pages/Builder';
import BuilderTest from './pages/builderTest'
import HomeTest from './pages/homeTest';
import { parseXml } from './steps';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/builderTest" element={<BuilderTest />} />
        <Route path="/homeTest" element={<HomeTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;