import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Register() {
  const navigate = useNavigate();
  // ดึง URL Backend
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
      Swal.fire('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน', 'warning');
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
        Swal.fire('สำเร็จ!', 'สมัครสมาชิกเรียบร้อยแล้ว', 'success').then(() => {
          navigate('/login');
        });
      } else {
        Swal.fire('ผิดพลาด', data.message || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  };

  // Class สำหรับ Input เพื่อให้แก้ที่เดียวจบ (เพิ่ม mb-2 และ padding ให้ดูสวย)
  const inputClass = "appearance-none relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 sm:text-sm shadow-sm transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sarabun transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700">
        
        {/* หัวข้อ */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            ลงทะเบียนสมาชิก
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            กรอกข้อมูลเพื่อเข้าใช้งานระบบ
          </p>
        </div>

        <form className="mt-8" onSubmit={handleSubmit}>
          
          {/* ส่วนข้อมูลส่วนตัว */}
          <div className="space-y-5"> {/* เว้นระยะห่างระหว่างก้อนใหญ่ 5 หน่วย */}

            {/* คำนำหน้า */}
            <div>
                <label className={labelClass}>คำนำหน้า</label>
                <select name="prefix" value={formData.prefix} onChange={handleChange} className={inputClass}>
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                </select>
            </div>

            {/* ชื่อ - นามสกุล (วางคู่กัน) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>ชื่อจริง</label>
                    <input name="first_name" type="text" required placeholder="สมชาย" onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>นามสกุล</label>
                    <input name="last_name" type="text" required placeholder="ใจดี" onChange={handleChange} className={inputClass} />
                </div>
            </div>

            {/* เบอร์โทร & เพศ (วางคู่กัน) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>เบอร์โทรศัพท์</label>
                    <input name="phone" type="tel" required placeholder="08x-xxx-xxxx" onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>เพศ</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                </div>
            </div>

            {/* อีเมล */}
            <div>
                <label className={labelClass}>อีเมล</label>
                <input name="email" type="email" required placeholder="name@example.com" onChange={handleChange} className={inputClass} />
            </div>

            {/* รหัสผ่าน */}
            <div>
                <label className={labelClass}>รหัสผ่าน</label>
                <input name="password" type="password" required placeholder="••••••••" onChange={handleChange} className={inputClass} />
            </div>
            
            {/* ยืนยันรหัสผ่าน */}
            <div>
                <label className={labelClass}>ยืนยันรหัสผ่าน</label>
                <input name="confirmPassword" type="password" required placeholder="••••••••" onChange={handleChange} className={inputClass} />
            </div>

          </div>

          {/* ปุ่มสมัคร */}
          <div className="mt-8">
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
              สมัครสมาชิก
            </button>
          </div>
          
          {/* ลิงก์ไปหน้า Login */}
          <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                  มีบัญชีอยู่แล้ว?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                      เข้าสู่ระบบที่นี่
                  </Link>
              </p>
          </div>

        </form>
      </div>
    </div>
  );
}