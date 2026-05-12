import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicLayout from './components/public/PublicLayout';
import AdminRoute from './routes/AdminRoute';
import { PUBLIC_PAGE_REGISTRY } from './routes/pageRegistry';
import { PUBLIC_LAYOUT_ROUTES } from './routes/publicRoutes';
import './index.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<PublicLayout />}>
          {PUBLIC_LAYOUT_ROUTES.map((route) => {
            const PageComponent = PUBLIC_PAGE_REGISTRY[route.page];
            return <Route key={route.path} path={route.path} element={<PageComponent {...(route.props || {})} />} />;
          })}
          <Route path="/admin" element={<AdminRoute />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
