import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 1. บันทึกข้อมูลลงเครื่อง
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        // 2. แจ้งเตือน Navbar ให้อัปเดตทันที (สำคัญมาก!)
        window.dispatchEvent(new Event('storage-update'));

        // 3. แสดงข้อความสำเร็จ
        Swal.fire({
          icon: 'success',
          title: 'ยินดีต้อนรับ!',
          text: `สวัสดีคุณ ${data.user.first_name}`,
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // 4. พาไปหน้าตามสิทธิ์ (Admin -> Dashboard, User -> Home)
          if (data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        });
      } else {
        throw new Error(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: error.message,
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-slate-900 font-sarabun px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">เข้าสู่ระบบ</h2>
          <p className="text-blue-100">ยินดีต้อนรับกลับสู่วิทยาลัยอาชีวศึกษานครสวรรค์</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">อีเมล</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">รหัสผ่าน</label>
               {/* ✅ ลิงก์กู้รหัสผ่าน (เชื่อมกับหน้าที่สร้างไปก่อนหน้านี้) */}
               <Link to="/forgot-password" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  ลืมรหัสผ่าน?
               </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                เข้าสู่ระบบ <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* Register Link */}
          <div className="pt-4 text-center border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ยังไม่มีบัญชีใช่ไหม?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                สมัครสมาชิกใหม่
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}