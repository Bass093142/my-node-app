import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard'; // ✅ อย่าลืม import
import ThemeToggle from './components/ThemeToggle';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ฟังก์ชันดึงข้อมูล User ล่าสุด
  const syncUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  };

  // ✅ ทำงานเมื่อเปิดเว็บ หรือเมื่อมีการ Login/Logout (โดยไม่ต้องรีเฟรช)
  useEffect(() => {
    syncUser(); // ครั้งแรกที่โหลด

    // สร้างตัวดักฟังเหตุการณ์
    const handleStorageChange = () => syncUser();
    window.addEventListener('storage-update', handleStorageChange);

    return () => {
      window.removeEventListener('storage-update', handleStorageChange);
    };
  }, []);

  // ✅ ฟังก์ชัน Logout แบบใหม่ (ไม่ใช้ reload)
  const handleLogout = () => {
    localStorage.removeItem('user'); // ลบข้อมูล
    window.dispatchEvent(new Event('storage-update')); // บอก Navbar ให้เปลี่ยน
    navigate('/login'); // ดีดไปหน้า Login
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* --- Navbar --- */}
      <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            
            <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              📰 News App
            </Link>

            <div className="flex gap-4 items-center">
              <ThemeToggle />

              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 font-medium">
                หน้าแรก
              </Link>

              {/* ✅ ส่วนเช็ค Role: ถ้าเป็น Admin ให้โชว์ปุ่มนี้ */}
              {user && user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="bg-red-100 text-red-600 px-3 py-1 rounded-lg font-bold hover:bg-red-200 border border-red-200 transition-colors"
                >
                  🛠️ จัดการระบบ
                </Link>
              )}
              
              {/* ส่วนล็อกอิน/ล็อกเอาท์ */}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold hidden sm:inline">
                    สวัสดี, {user.first_name}
                  </span>
                  <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
                    ออกจากระบบ
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
                    เข้าสู่ระบบ
                  </Link>
                  <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                    สมัครสมาชิก
                  </Link>
                </div>
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
          
          {/* ✅ Route Admin (ป้องกันคนทั่วไปเข้า) */}
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <div className="text-center mt-20 text-gray-500">
                  <h1 className="text-2xl font-bold mb-2">⛔ ไม่มีสิทธิ์เข้าถึง</h1>
                  <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
                  <Link to="/" className="text-blue-500 underline mt-4 inline-block">กลับหน้าหลัก</Link>
                </div>
              )
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;