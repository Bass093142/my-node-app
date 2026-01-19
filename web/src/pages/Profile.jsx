import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { User, Camera, Save, Lock } from 'lucide-react';

export default function Profile() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    id: '', first_name: '', last_name: '', email: '', role: '', profile_image: '', password: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) setFormData({ ...user, password: '' }); // password ว่างไว้ถ้าไม่แก้
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => setFormData({ ...formData, profile_image: reader.result });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user)); // อัปเดต LocalStorage
        window.dispatchEvent(new Event('storage-update')); // อัปเดต Navbar
        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 font-sarabun">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">แก้ไขข้อมูลส่วนตัว</h2>
          <p className="opacity-80">จัดการข้อมูลโปรไฟล์และรูปภาพของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                {formData.profile_image ? (
                  <img src={formData.profile_image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={48} /></div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">คลิกเพื่อเปลี่ยนรูปโปรไฟล์</p>
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อจริง</label>
              <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">นามสกุล</label>
              <input type="text" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">อีเมล (แก้ไขไม่ได้)</label>
            <input type="email" disabled className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 dark:bg-slate-600 dark:text-gray-400" value={formData.email} />
          </div>

          <div>
             <label className="block text-sm font-medium mb-1 dark:text-gray-300 flex items-center gap-1"><Lock size={14}/> เปลี่ยนรหัสผ่าน (ถ้าไม่เปลี่ยนให้เว้นว่าง)</label>
             <input type="password" placeholder="รหัสผ่านใหม่" className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
            <Save size={20} /> บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </div>
  );
}