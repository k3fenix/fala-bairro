import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Feed from './pages/Feed';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Register from './pages/Register';
import Login from './pages/Login';
import BottomNav from './components/BottomNav';

// Wrapper to conditionally hide BottomNav on admin routes
function NavigationWrapper() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';
  
  return (!isAdminRoute && !isAuthRoute) ? <BottomNav /> : null;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Add more routes here */}
        </Routes>
        <NavigationWrapper />
      </div>
    </Router>
  );
}

export default App;
