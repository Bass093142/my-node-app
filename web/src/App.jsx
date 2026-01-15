import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// ✅ 1. นำเข้าปุ่มเปลี่ยนธีม (อย่าลืมสร้างไฟล์ ThemeToggle.jsx ใน folder components นะ)
import ThemeToggle from './components/ThemeToggle';

function App() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    // ✅ 2. เพิ่ม dark:bg-slate-900 และ dark:text-white ที่ตัวคลุมหลัก
    // ใส่ transition-colors เพื่อให้เปลี่ยนสีนุ่มๆ
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* --- Navbar --- */}
      {/* ✅ 3. ปรับสี Navbar เป็น dark:bg-slate-800 */}
      <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            
            {/* โลโก้ */}
            <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              📰 News App
            </Link>

            <div className="flex gap-4 items-center">
              {/* ✅ 4. วางปุ่มเปลี่ยนธีมไว้ตรงนี้ (ก่อนปุ่ม Login/Logout หรือวางท้ายสุดก็ได้) */}
              <ThemeToggle />

              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 font-medium">
                หน้าแรก
              </Link>
              
              {user ? (
                <>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    สวัสดี, {user.firstName}
                  </span>
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors">
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
                    เข้าสู่ระบบ
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                    สมัครสมาชิก
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- Content --- */}
      <div className="p-6 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;