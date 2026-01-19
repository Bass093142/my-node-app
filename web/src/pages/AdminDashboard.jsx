import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // State สำหรับข้อมูลหลัก
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับ Modal ข่าว (เพิ่ม/แก้ไข)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentNewsId, setCurrentNewsId] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category_id: '',
    image_url: '',
    author_name: '' // เพิ่มฟิลด์ผู้เขียน
  });

  // ตรวจสอบสิทธิ์ Admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      Swal.fire('เข้าถึงไม่ได้', 'คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้', 'error');
      navigate('/');
    } else {
      // Set ชื่อผู้เขียนเริ่มต้นเป็นชื่อ Admin คนปัจจุบัน
      setNewsForm(prev => ({ ...prev, author_name: user.first_name || 'Admin' }));
      fetchData();
    }
  }, [navigate]);

  // ฟังก์ชันดึงข้อมูลทั้งหมด (Users, Reports, News, Categories)
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. ดึงข้อมูล User & Reports
      const [resUsers, resReports, resNews, resCats] = await Promise.all([
        fetch(`${apiUrl}/api/admin/users`),
        fetch(`${apiUrl}/api/admin/reports`),
        fetch(`${apiUrl}/api/news`),
        fetch(`${apiUrl}/api/news/categories/all`)
      ]);

      setUsers(await resUsers.json());
      setReports(await resReports.json());
      setNewsList(await resNews.json());
      setCategories(await resCats.json());
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // --- ส่วนจัดการข่าว (News CRUD) ---

  const handleOpenModal = (newsItem = null) => {
    if (newsItem) {
      // โหมดแก้ไข
      setIsEditMode(true);
      setCurrentNewsId(newsItem.id);
      setNewsForm({
        title: newsItem.title,
        content: newsItem.content,
        category_id: newsItem.category_id,
        image_url: newsItem.image_url || '',
        author_name: newsItem.author_name || 'Admin'
      });
    } else {
      // โหมดเพิ่มใหม่
      const user = JSON.parse(localStorage.getItem('user'));
      setIsEditMode(false);
      setCurrentNewsId(null);
      setNewsForm({
        title: '',
        content: '',
        category_id: categories.length > 0 ? categories[0].id : '', // เลือกหมวดแรกเป็น Default
        image_url: '',
        author_name: user?.first_name || 'Admin'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${apiUrl}/api/news/${currentNewsId}` : `${apiUrl}/api/news`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm)
      });

      if (response.ok) {
        Swal.fire('สำเร็จ', isEditMode ? 'แก้ไขข่าวเรียบร้อย' : 'เพิ่มข่าวเรียบร้อย', 'success');
        setIsModalOpen(false);
        fetchData(); // รีโหลดข้อมูล
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  const handleDeleteNews = async (id) => {
    const result = await Swal.fire({
      title: 'ลบข่าวนี้?',
      text: "คุณต้องการลบข่าวนี้ใช่ไหม?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบเลย'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`${apiUrl}/api/news/${id}`, { method: 'DELETE' });
        Swal.fire('ลบแล้ว', 'ข่าวถูกลบออกจากระบบ', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('ผิดพลาด', 'ลบข่าวไม่สำเร็จ', 'error');
      }
    }
  };

  // --- ส่วนจัดการ User ---
  const handleBanUser = async (id, currentStatus) => {
    try {
      await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: !currentStatus })
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "ไม่สามารถย้อนกลับได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบเลย!'
    });

    if (result.isConfirmed) {
      await fetch(`${apiUrl}/api/admin/users/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // --- ส่วนจัดการ Report ---
  const handleUpdateReport = async (id, newStatus) => {
    await fetch(`${apiUrl}/api/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  // --- Export PDF ---
  const handleExportPDF = () => {
    const element = document.getElementById('admin-report-content');
    const opt = {
      margin: 0.5,
      filename: `report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Chart Config
  const chartOptions = {
    chart: { id: 'news-views' },
    xaxis: { categories: newsList.slice(0, 5).map(n => n.title.substring(0, 10) + '...') }, // ชื่อข่าว 5 อันดับแรก
    colors: ['#3b82f6'],
    title: { text: 'ยอดวิว 5 ข่าวล่าสุด', style: { fontFamily: 'Sarabun' } }
  };
  const chartSeries = [{ name: 'ยอดวิว', data: newsList.slice(0, 5).map(n => n.view_count || 0) }];

  return (
    <div className="space-y-8 pb-10 font-sarabun relative">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🛠️ Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">จัดการข่าว ผู้ใช้ และรายงานปัญหา</p>
        </div>
        <button onClick={handleExportPDF} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition-all">
          📄 Export PDF
        </button>
      </div>

      <div id="admin-report-content" className="space-y-8">
        
        {/* 1. กราฟสถิติ */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <Chart options={chartOptions} series={chartSeries} type="bar" height={300} />
        </div>

        {/* 2. จัดการข่าว (News CRUD) - ส่วนใหม่ที่เพิ่มเข้ามา */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4 border-b pb-4 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white border-l-4 border-blue-500 pl-3">
              จัดการข่าวสาร ({newsList.length})
            </h2>
            <button 
              onClick={() => handleOpenModal()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-transform transform hover:-translate-y-0.5"
            >
              + เพิ่มข่าวใหม่
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-blue-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                  <th className="p-3 rounded-tl-lg">รูปปก</th>
                  <th className="p-3">หัวข้อข่าว</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">ยอดวิว</th>
                  <th className="p-3 rounded-tr-lg text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {newsList.map((news) => (
                  <tr key={news.id} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="p-3">
                      {news.image_url ? (
                        <img src={news.image_url} alt="cover" className="w-16 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">No Img</div>
                      )}
                    </td>
                    <td className="p-3 max-w-xs truncate text-gray-800 dark:text-gray-200" title={news.title}>
                      {news.title}
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                        {news.category_name || 'ทั่วไป'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{news.view_count}</td>
                    <td className="p-3 flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(news)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm shadow-sm"
                      >
                        แก้ไข
                      </button>
                      <button 
                        onClick={() => handleDeleteNews(news.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm shadow-sm"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. จัดการผู้ใช้งาน */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-purple-500 pl-3">
            จัดการผู้ใช้งาน ({users.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                  <th className="p-3 rounded-tl-lg">ชื่อ-สกุล</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 rounded-tr-lg text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                    <td className="p-3 text-gray-800 dark:text-gray-200">{u.first_name} {u.last_name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="p-3">
                       {u.is_banned ? <span className="text-red-500 font-bold">ถูกแบน</span> : <span className="text-green-500">ปกติ</span>}
                    </td>
                    <td className="p-3 text-center">
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleBanUser(u.id, u.is_banned)}
                          className={`px-3 py-1 rounded text-sm text-white ${u.is_banned ? 'bg-green-500' : 'bg-orange-500'}`}
                        >
                          {u.is_banned ? 'ปลดแบน' : 'แบน'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 4. รายงานปัญหา (Reports) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
           <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-yellow-500 pl-3">
            รายงานปัญหา ({reports.length})
          </h2>
           {/* (ตาราง Reports เหมือนเดิม - ย่อโค้ดเพื่อความกระชับ) */}
           <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                <tr className="bg-yellow-50 dark:bg-slate-700">
                  <th className="p-3">หัวข้อ</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">อัปเดต</th>
                </tr>
               </thead>
               <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b dark:border-slate-700">
                      <td className="p-3 dark:text-gray-200">{r.topic}</td>
                      <td className="p-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs dark:text-black">{r.status}</span></td>
                      <td className="p-3">
                         <select 
                            value={r.status} 
                            onChange={(e) => handleUpdateReport(r.id, e.target.value)}
                            className="bg-white border rounded p-1 text-sm dark:bg-slate-600 dark:text-white"
                          >
                            <option value="pending">รอตรวจสอบ</option>
                            <option value="resolved">แก้ไขแล้ว</option>
                            <option value="closed">ปิดงาน</option>
                         </select>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
           </div>
        </div>

      </div>

      {/* --- Modal Form เพิ่ม/แก้ไข ข่าว --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center">
              <h3 className="text-white text-lg font-bold">
                {isEditMode ? '✏️ แก้ไขข่าวสาร' : '📝 เพิ่มข่าวใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleNewsSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หัวข้อข่าว</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">หมวดหมู่</label>
                  <select 
                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={newsForm.category_id}
                    onChange={(e) => setNewsForm({...newsForm, category_id: e.target.value})}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ลิงก์รูปภาพ (URL)</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={newsForm.image_url}
                    onChange={(e) => setNewsForm({...newsForm, image_url: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เนื้อหาข่าว</label>
                <textarea 
                  rows="5"
                  required
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                >
                  {isEditMode ? 'บันทึกการแก้ไข' : 'โพสต์ข่าวทันที'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}