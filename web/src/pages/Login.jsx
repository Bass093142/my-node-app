import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://my-node-app-fce8.onrender.com/'; // ⚠️ แก้ตรงนี้

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, formData); // แก้ path ให้ตรงกับ server
      alert('เข้าสู่ระบบสำเร็จ!');
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
      window.location.reload();
    } catch (err) {
      alert('เข้าสู่ระบบไม่ผ่าน: ' + (err.response?.data?.message || 'ตรวจสอบอีเมล/รหัสผ่าน'));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">ยินดีต้อนรับกลับ</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-2 font-medium">อีเมล</label>
            <input 
              type="email" name="email" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2 font-medium">รหัสผ่าน</label>
            <input 
              type="password" name="password" required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition transform active:scale-95">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;