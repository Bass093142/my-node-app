import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2'; // แนะนำให้ลงเพิ่ม (npm install sweetalert2) เพื่อความสวยงาม หรือใช้ alert ปกติก็ได้

export default function Register() {
  const navigate = useNavigate();
  
  // URL ของ Backend (ดึงจาก .env ถ้าไม่มีใช้ localhost)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [formData, setFormData] = useState({
    prefix: 'นาย',
    first_name: '',
    last_name: '',
    gender: 'ชาย',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('สมัครสมาชิกสำเร็จ!'); // หรือใช้ Swal.fire(...)
        navigate('/login');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sarabun">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            สมัครสมาชิกใหม่
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* คำนำหน้า */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">คำนำหน้า</label>
                <select name="prefix" value={formData.prefix} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md dark:bg-slate-700 dark:text-white">
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                </select>
            </div>

            {/* ชื่อ-นามสกุล */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <input name="first_name" type="text" required placeholder="ชื่อจริง" onChange={handleChange}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <input name="last_name" type="text" required placeholder="นามสกุล" onChange={handleChange}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
            </div>

            {/* อีเมล */}
            <div className="mb-4">
                <input name="email" type="email" required placeholder="อีเมล" onChange={handleChange}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            {/* เบอร์โทร & เพศ */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <input name="phone" type="text" required placeholder="เบอร์โทรศัพท์" onChange={handleChange}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                <select name="gender" value={formData.gender} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-md dark:bg-slate-700 dark:text-white">
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                </select>
            </div>

            {/* รหัสผ่าน */}
            <div className="mb-4">
                <input name="password" type="password" required placeholder="รหัสผ่าน" onChange={handleChange}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2" />
                <input name="confirmPassword" type="password" required placeholder="ยืนยันรหัสผ่าน" onChange={handleChange}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              สมัครสมาชิก
            </button>
          </div>
          
          <div className="text-center mt-4">
              <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
                  มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
              </Link>
          </div>
        </form>
      </div>
    </div>
  );
}