import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { KeyRound, Mail, Dog, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [form, setForm] = useState({ email: '', pet_name: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนรหัสผ่านสำเร็จ!',
          text: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
          confirmButtonColor: '#2563eb'
        }).then(() => navigate('/login'));
      } else {
        throw new Error(data.message || 'ข้อมูลไม่ถูกต้อง');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message,
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
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-bold">กู้คืนรหัสผ่าน</h2>
          <p className="opacity-90 text-sm mt-1">ใช้ชื่อสัตว์เลี้ยงของคุณเพื่อยืนยันตัวตน</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">อีเมลที่ลงทะเบียน</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={18}/></div>
              <input type="email" required placeholder="name@example.com" className="w-full pl-10 p-2.5 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" 
                onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อสัตว์เลี้ยง (Security Question)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Dog size={18}/></div>
              <input type="text" required placeholder="เช่น เจ้าตูบ, มอมแมม" className="w-full pl-10 p-2.5 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" 
                onChange={e => setForm({...form, pet_name: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">รหัสผ่านใหม่</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><CheckCircle size={18}/></div>
              <input type="password" required placeholder="ตั้งรหัสผ่านใหม่" className="w-full pl-10 p-2.5 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" 
                onChange={e => setForm({...form, new_password: e.target.value})} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex justify-center items-center gap-2">
            {loading ? 'กำลังตรวจสอบ...' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </form>

        <div className="bg-gray-50 dark:bg-slate-700 p-4 text-center">
          <Link to="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-orange-600 flex items-center justify-center gap-2 font-medium">
            <ArrowLeft size={16}/> กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}