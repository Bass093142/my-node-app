import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Shield } from 'lucide-react';

// นำเข้าหน้าต่างๆ (Pages)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import NewsDetail from './pages/NewsDetail';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ฟังก์ชันดึงข้อมูล User จาก LocalStorage
  const syncUser = () => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    syncUser(); // ทำงานครั้งแรก
    // ดักฟังเหตุการณ์ login/logout เพื่ออัปเดต Navbar ทันที
    window.addEventListener('storage-update', syncUser);
    return () => window.removeEventListener('storage-update', syncUser);
  }, []);

  // ปิดเมนูมือถือทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage-update')); // แจ้งเตือนระบบว่าออกแล้ว
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sarabun text-gray-900 dark:text-gray-100 flex flex-col">
      
      {/* --- Navbar --- */}
      <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                📰 <span className="hidden sm:block">NewsCollege</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium px-3 py-2">หน้าแรก</Link>
              
              {/* ปุ่ม Admin (โชว์เฉพาะแอดมิน) */}
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg border border-red-200 font-bold transition-all">
                  <Shield size={16} /> จัดการระบบ
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-slate-700">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <User size={16} /> คุณ{user.first_name}
                  </span>
                  <button onClick={handleLogout} className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition-colors">
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors">
                    เข้าสู่ระบบ
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-transform transform hover:-translate-y-0.5">
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-800 border-t dark:border-slate-700 px-4 pt-2 pb-4 space-y-2 shadow-lg">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-slate-700">หน้าแรก</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-bold text-red-600 bg-red-50">🛠️ จัดการระบบ</Link>
            )}
            {user ? (
              <>
                <div className="px-3 py-2 text-sm text-gray-500">ล็อกอินโดย: {user.email}</div>
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
                  <LogOut size={18} /> ออกจากระบบ
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link to="/login" className="text-center py-2 border rounded-lg hover:bg-gray-50">เข้าสู่ระบบ</Link>
                <Link to="/register" className="text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">สมัครสมาชิก</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* --- Content Area --- */}
      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route Admin (ป้องกันคนนอกเข้า) */}
          <Route 
            path="/admin" 
            element={
              user?.role === 'admin' ? <AdminDashboard /> : 
              <div className="text-center py-20 text-red-500 font-bold text-xl">⛔ คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
            } 
          />
        </Routes>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-white dark:bg-slate-800 border-t dark:border-slate-700 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2026 Nakhon Sawan Vocational College. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;