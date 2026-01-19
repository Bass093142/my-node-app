import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Login() {
  const navigate = useNavigate();
  // ดึงลิงก์ Backend จาก Environment
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ 1. บันทึกข้อมูล (data.user คือก้อนข้อมูลที่มี role, name, id)
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ 2. ยิงพลุสัญญาณบอก App.jsx ว่า "มีคนล็อกอินแล้วนะ!" (สำคัญมาก)
        window.dispatchEvent(new Event('storage-update'));

        // 3. แจ้งเตือนและไปหน้าแรก
        Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ!',
          text: `ยินดีต้อนรับคุณ ${data.user.first_name}`, // แก้ให้ตรงกับ backend
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/'); // ไปหน้าแรกโดยไม่ต้อง Reload
        });

      } else {
        Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        });
      }

    } catch (error) {
      console.error('Login Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
      });
    }
  };

  // Styles
  const inputClass = "appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 sm:text-sm shadow-sm transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sarabun transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">กรอกอีเมลและรหัสผ่านเพื่อใช้งาน</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>อีเมล</label>
              <input name="email" type="email" required placeholder="name@example.com" className={inputClass} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>รหัสผ่าน</label>
              <input name="password" type="password" required placeholder="••••••••" className={inputClass} onChange={handleChange} />
            </div>
          </div>

          <div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
              เข้าสู่ระบบ
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                สมัครสมาชิกใหม่
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}