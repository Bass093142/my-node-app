import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';
// เรียกใช้ไอคอนสวยๆ จาก Lucide React
import { 
  LayoutDashboard, 
  Newspaper, 
  Users, 
  AlertTriangle, 
  LogOut, 
  Menu, 
  Plus, 
  Image as ImageIcon,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // --- State จัดการหน้าจอ ---
  const [activeTab, setActiveTab] = useState('overview'); // ตัวแปรคุม Sidebar (overview, news, users, reports)
  const [isSidebarOpen, setSidebarOpen] = useState(true); // สำหรับ Mobile
  
  // --- State ข้อมูล ---
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- State Modal & Form ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentNewsId, setCurrentNewsId] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category_id: '',
    image_url: '',
    author_name: ''
  });

  // Security Check & Fetch Data
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      Swal.fire('Access Denied', 'สำหรับผู้ดูแลระบบเท่านั้น', 'error');
      navigate('/');
    } else {
      setNewsForm(prev => ({ ...prev, author_name: user.first_name || 'Admin' }));
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
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
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // --- Handlers (News CRUD) ---
  const handleOpenModal = (newsItem = null) => {
    if (newsItem) {
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
      const user = JSON.parse(localStorage.getItem('user'));
      setIsEditMode(false);
      setCurrentNewsId(null);
      setNewsForm({
        title: '',
        content: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        image_url: '',
        author_name: user?.first_name || 'Admin'
      });
    }
    setIsModalOpen(true);
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${apiUrl}/api/news/${currentNewsId}` : `${apiUrl}/api/news`;
      const method = isEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsForm)
      });
      if (response.ok) {
        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleDeleteNews = async (id) => {
    const result = await Swal.fire({
      title: 'ลบข่าวนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบเลย'
    });
    if (result.isConfirmed) {
      await fetch(`${apiUrl}/api/news/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // --- Handlers (User & Report) ---
  const handleBanUser = async (id, currentStatus) => {
    await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_banned: !currentStatus })
    });
    fetchData();
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'ลบผู้ใช้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบ'
    });
    if (result.isConfirmed) {
      await fetch(`${apiUrl}/api/admin/users/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleUpdateReport = async (id, newStatus) => {
    await fetch(`${apiUrl}/api/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-content');
    html2pdf().from(element).save('admin-report.pdf');
  };

  // --- Chart Config ---
  const chartOptions = {
    chart: { id: 'news-views', toolbar: { show: false } },
    xaxis: { categories: newsList.slice(0, 5).map(n => n.title.substring(0, 10) + '...') },
    colors: ['#3b82f6'],
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 4 } }
  };
  const chartSeries = [{ name: 'ยอดวิว', data: newsList.slice(0, 5).map(n => n.view_count || 0) }];

  // --- Sidebar Menu Item Component ---
  const MenuItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 font-sarabun overflow-hidden">
      
      {/* 1. Sidebar (เมนูข้าง) */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-white dark:bg-slate-800 shadow-xl transition-all duration-300 flex flex-col z-20 overflow-hidden`}>
        <div className="p-6 border-b dark:border-slate-700 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><LayoutDashboard size={24} /></div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <MenuItem id="overview" icon={LayoutDashboard} label="ภาพรวมระบบ" />
          <MenuItem id="news" icon={Newspaper} label="จัดการข่าวสาร" />
          <MenuItem id="users" icon={Users} label="ผู้ใช้งาน" />
          <MenuItem id="reports" icon={AlertTriangle} label="แจ้งปัญหา" />
        </nav>

        <div className="p-4 border-t dark:border-slate-700">
          <button 
            onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content (เนื้อหาหลัก) */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center z-10">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <Menu className="text-gray-600 dark:text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 dark:text-white">Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ผู้ดูแลระบบสูงสุด</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">A</div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          {/* ---------------- Tab: Overview ---------------- */}
          {activeTab === 'overview' && (
            <div id="report-content" className="space-y-6 fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 แดชบอร์ดภาพรวม</h2>
                <button onClick={handleExportPDF} className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
                  <FileText size={18} /> Export PDF
                </button>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <p className="text-gray-500">ข่าวทั้งหมด</p>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{newsList.length}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                  <p className="text-gray-500">ผู้ใช้งาน</p>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{users.length}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                  <p className="text-gray-500">แจ้งปัญหา (รอแก้ไข)</p>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{reports.filter(r => r.status === 'pending').length}</h3>
                </div>
              </div>

              {/* Graph */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">สถิติยอดวิวข่าวล่าสุด</h3>
                <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
              </div>
            </div>
          )}

          {/* ---------------- Tab: News Management ---------------- */}
          {activeTab === 'news' && (
            <div className="space-y-6 fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📰 จัดการข่าวสาร</h2>
                <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                  <Plus size={20} /> เพิ่มข่าวใหม่
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsList.map((news) => (
                  <div key={news.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden group border dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="h-40 overflow-hidden relative">
                      {news.image_url ? (
                        <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => e.target.src='https://via.placeholder.com/400x200?text=No+Image'} />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={40} /></div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        👁️ {news.view_count}
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300">
                        {news.category_name || 'ทั่วไป'}
                      </span>
                      <h3 className="text-lg font-bold mt-2 text-gray-800 dark:text-white line-clamp-2 h-14">{news.title}</h3>
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t dark:border-slate-700">
                        <button onClick={() => handleOpenModal(news)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteNews(news.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- Tab: Users ---------------- */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden fade-in">
              <div className="p-6 border-b dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">👥 จัดการผู้ใช้งาน</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="p-4">ผู้ใช้</th>
                      <th className="p-4">บทบาท</th>
                      <th className="p-4">สถานะ</th>
                      <th className="p-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                        <td className="p-4">
                          <p className="font-bold text-gray-800 dark:text-white">{u.first_name} {u.last_name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </td>
                        <td className="p-4"><span className="bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-xs">{u.role}</span></td>
                        <td className="p-4">
                          {u.is_banned ? <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs font-bold">โดนแบน</span> : <span className="text-green-500 bg-green-50 px-2 py-1 rounded text-xs font-bold">ปกติ</span>}
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                          {u.role !== 'admin' && (
                            <>
                              <button onClick={() => handleBanUser(u.id, u.is_banned)} className={`px-3 py-1 rounded text-sm text-white ${u.is_banned ? 'bg-green-500' : 'bg-orange-500'}`}>{u.is_banned ? 'ปลด' : 'แบน'}</button>
                              <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 rounded text-sm bg-red-500 text-white">ลบ</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------- Tab: Reports ---------------- */}
          {activeTab === 'reports' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden fade-in">
              <div className="p-6 border-b dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">⚠️ รายงานปัญหา</h2>
              </div>
              <table className="w-full text-left">
                <thead className="bg-yellow-50 dark:bg-slate-700">
                  <tr>
                    <th className="p-4">หัวข้อ</th>
                    <th className="p-4">รายละเอียด</th>
                    <th className="p-4">สถานะ</th>
                    <th className="p-4">อัปเดต</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td className="p-4 font-bold text-gray-800 dark:text-white">{r.topic}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{r.description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : r.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {r.status === 'pending' ? 'รอ' : r.status === 'resolved' ? 'เสร็จ' : 'ปิด'}
                        </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={r.status} 
                          onChange={(e) => handleUpdateReport(r.id, e.target.value)}
                          className="bg-white dark:bg-slate-600 border rounded p-1 text-sm dark:text-white"
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
          )}
        </div>
      </main>

      {/* --- Modal Form (News) with Image Preview --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {isEditMode ? <Edit size={20}/> : <Plus size={20}/>} 
                {isEditMode ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวใหม่'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-blue-700 p-1 rounded-full text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleNewsSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">หัวข้อข่าว</label>
                    <input type="text" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={newsForm.title} onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">หมวดหมู่</label>
                    <select className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={newsForm.category_id} onChange={(e) => setNewsForm({...newsForm, category_id: e.target.value})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* ✅ Image Input & Preview Zone */}
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">ลิงก์รูปภาพ (URL)</label>
                  <input type="text" placeholder="https://..." className="w-full p-2 border rounded-lg mb-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={newsForm.image_url} onChange={(e) => setNewsForm({...newsForm, image_url: e.target.value})} />
                  
                  {/* พื้นที่แสดงรูป Preview */}
                  <div className="h-32 w-full bg-gray-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden relative group">
                    {newsForm.image_url ? (
                      <img 
                        src={newsForm.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display='none'; }} 
                      />
                    ) : (
                      <span className="text-gray-400 text-sm flex flex-col items-center">
                        <ImageIcon size={24} className="mb-1"/> ใส่ลิงก์เพื่อดูรูปตัวอย่าง
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">เนื้อหาข่าว</label>
                <textarea rows="5" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={newsForm.content} onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg flex items-center gap-2">
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