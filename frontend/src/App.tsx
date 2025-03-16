import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
// import HomeTest from './pages/homeTest';

import ProtectedRoute from './ProtectedRoute';
import Builder from './pages/Builder';
// import BuilderTest from './pages/builderTest'
// import BuilderTest from './pages/Buildertest1'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/homeTest" element={<HomeTest />} /> */}

        <Route element={<ProtectedRoute />}>
          <Route path="/builder" element={<Builder />} />
        </Route>
        {/* <Route path="/buildertest1" element={<Builder />} /> */}
        {/* <Route path="/builderTest" element={<BuilderTest />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;