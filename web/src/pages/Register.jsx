import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://my-node-app-fce8.onrender.com/'; // ⚠️ แก้ตรงนี้

function Register() {
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ยิงไปที่ /api/register ตาม server.js
      await axios.post(`${API_URL}/api/register`, formData);
      alert('สมัครสมาชิกเรียบร้อย! กรุณาเข้าสู่ระบบ');
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">สร้างบัญชีใหม่</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">อีเมล</label>
            <input type="email" name="email" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">รหัสผ่าน</label>
            <input type="password" name="password" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ชื่อจริง</label>
            <input type="text" name="firstName" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">นามสกุล</label>
            <input type="text" name="lastName" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">เบอร์โทรศัพท์</label>
            <input type="text" name="phone" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleChange} />
          </div>
          <div className="col-span-2 mt-4">
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold shadow-md transition transform active:scale-95">
              ลงทะเบียน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;