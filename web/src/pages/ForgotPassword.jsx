import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { KeyRound, Dog } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [form, setForm] = useState({ email: '', pet_name: '', new_password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success').then(() => navigate('/login'));
      } else {
        Swal.fire('ผิดพลาด', data.message, 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 font-sarabun p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">🔐 กู้คืนรหัสผ่าน</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 dark:text-gray-300">อีเมล</label>
            <input type="email" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white"
              onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1 dark:text-gray-300 flex items-center gap-1"><Dog size={16}/> ชื่อสัตว์เลี้ยงของคุณ (Security Question)</label>
            <input type="text" required placeholder="เช่น เจ้าตูบ, มอมแมม" className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white"
              onChange={e => setForm({...form, pet_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1 dark:text-gray-300">รหัสผ่านใหม่</label>
            <input type="password" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white"
              onChange={e => setForm({...form, new_password: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">เปลี่ยนรหัสผ่าน</button>
        </form>
        <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-blue-500">กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}