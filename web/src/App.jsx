import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Shield } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import NewsDetail from './pages/NewsDetail';
import Profile from './pages/Profile'; 
import CookieConsent from './components/CookieConsent'; 
// ✅ 1. Import ไฟล์เข้ามา
import ForgotPassword from './pages/ForgotPassword'; 

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const syncUser = () => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    syncUser();
    window.addEventListener('storage-update', syncUser);
    return () => window.removeEventListener('storage-update', syncUser);
  }, []);

  useEffect(() => setIsMobileMenuOpen(false), [location]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage-update'));
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sarabun text-gray-900 dark:text-gray-100 flex flex-col">
      <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">📰 NewsCollege</Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="font-medium hover:text-blue-600">หน้าแรก</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg border border-red-200 font-bold">
                  <Shield size={16} /> จัดการระบบ
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-slate-700">
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80">
                    {user.profile_image ? (
                        <img src={user.profile_image} className="w-8 h-8 rounded-full object-cover border border-gray-300"/>
                    ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><User size={16}/></div>
                    )}
                    คุณ{user.first_name}
                  </Link>
                  <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 px-3 py-2 rounded-lg text-sm"><LogOut size={16}/></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="px-4 py-2 border border-blue-600 rounded-lg text-blue-600">เข้าสู่ระบบ</Link>
                  <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg">สมัครสมาชิก</Link>
                </div>
              )}
            </div>
            <div className="md:hidden flex items-center">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu/></button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-800 px-4 py-4 space-y-2 shadow-lg">
             <Link to="/" className="block py-2">หน้าแรก</Link>
             {user?.role === 'admin' && <Link to="/admin" className="block py-2 text-red-600 font-bold">จัดการระบบ</Link>}
             {user ? (
                <>
                    <Link to="/profile" className="block py-2 text-blue-600 font-bold">แก้ไขข้อมูลส่วนตัว</Link>
                    <button onClick={handleLogout} className="w-full text-left py-2 text-red-600">ออกจากระบบ</button>
                </>
             ) : (
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link to="/login" className="text-center py-2 border rounded">เข้าสู่ระบบ</Link>
                    <Link to="/register" className="text-center py-2 bg-blue-600 text-white rounded">สมัครสมาชิก</Link>
                 </div>
             )}
          </div>
        )}
      </nav>

      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* ✅ 2. เพิ่ม Route นี้เข้าไปครับ ไม่งั้นจะขึ้น Error No routes matched */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/profile" element={user ? <Profile /> : <div className="text-center mt-10">กรุณาเข้าสู่ระบบ</div>} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <div className="text-center mt-10 text-red-500">Access Denied</div>} />
        </Routes>
      </main>

      <CookieConsent />

      <footer className="bg-white dark:bg-slate-800 border-t dark:border-slate-700 py-6 mt-auto text-center text-gray-500 text-sm">
        <p>© 2026 Nakhon Sawan Vocational College. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;