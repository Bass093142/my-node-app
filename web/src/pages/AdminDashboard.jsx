import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, Newspaper, Users, AlertTriangle, LogOut, 
  Menu, X, Plus, Image as ImageIcon, Edit, Trash2, FileText, UploadCloud
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fileInputRef = useRef(null);
  
  // --- State UI ---
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false); // เช็คสถานะลากไฟล์
  
  // --- State Data ---
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- State Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentNewsId, setCurrentNewsId] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: '', content: '', category_id: '', image_url: '', author_name: ''
  });

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
    } catch (error) { console.error('Error:', error); setLoading(false); }
  };

  // --- Image Upload Logic (Drag & Drop + Base64) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      Swal.fire('ไฟล์ผิดประเภท', 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }
    // แปลงไฟล์เป็น Base64 String เพื่อส่งไปพร้อม JSON
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setNewsForm({ ...newsForm, image_url: reader.result });
    };
  };

  const removeImage = () => {
    setNewsForm({ ...newsForm, image_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- CRUD Handlers ---
  const handleOpenModal = (newsItem = null) => {
    if (newsItem) {
      setIsEditMode(true);
      setCurrentNewsId(newsItem.id);
      setNewsForm({
        title: newsItem.title, content: newsItem.content, category_id: newsItem.category_id,
        image_url: newsItem.image_url || '', author_name: newsItem.author_name || 'Admin'
      });
    } else {
      const user = JSON.parse(localStorage.getItem('user'));
      setIsEditMode(false);
      setCurrentNewsId(null);
      setNewsForm({
        title: '', content: '', category_id: categories.length > 0 ? categories[0].id : '',
        image_url: '', author_name: user?.first_name || 'Admin'
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
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newsForm)
      });
      if (response.ok) {
        Swal.fire('สำเร็จ', 'บันทึกเรียบร้อย', 'success');
        setIsModalOpen(false);
        fetchData();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) { Swal.fire('Error', 'เกิดข้อผิดพลาด (รูปอาจใหญ่เกินไป)', 'error'); }
  };

  const handleDeleteNews = async (id) => { /* ...เดิม... */ 
    const result = await Swal.fire({ title: 'ลบข่าว?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'ลบ' });
    if (result.isConfirmed) { await fetch(`${apiUrl}/api/news/${id}`, { method: 'DELETE' }); fetchData(); }
  };
  const handleBanUser = async (id, status) => { /* ...เดิม... */ 
    await fetch(`${apiUrl}/api/admin/users/${id}/ban`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_banned: !status }) });
    fetchData();
  };
  const handleDeleteUser = async (id) => { /* ...เดิม... */ 
    const result = await Swal.fire({ title: 'ลบผู้ใช้?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'ลบ' });
    if (result.isConfirmed) { await fetch(`${apiUrl}/api/admin/users/${id}`, { method: 'DELETE' }); fetchData(); }
  };
  const handleUpdateReport = async (id, status) => { /* ...เดิม... */ 
    await fetch(`${apiUrl}/api/admin/reports/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status }) });
    fetchData();
  };
  const handleExportPDF = () => { /* ...เดิม... */ 
    const element = document.getElementById('report-content');
    html2pdf().from(element).save('admin-report.pdf');
  };

  const chartOptions = { chart: { id: 'news-views', toolbar: { show: false } }, xaxis: { categories: newsList.slice(0, 5).map(n => n.title.substring(0, 10) + '...') }, colors: ['#3b82f6'] };
  const chartSeries = [{ name: 'ยอดวิว', data: newsList.slice(0, 5).map(n => n.view_count || 0) }];

  const MenuItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
      <Icon size={20} /> <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-900 font-sarabun overflow-hidden relative">
      
      {/* 1. Mobile Backdrop */}
      {isMobileMenuOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* 2. Responsive Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><LayoutDashboard size={24} /></div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500 hover:text-red-500"><X size={24} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuItem id="overview" icon={LayoutDashboard} label="ภาพรวม" />
          <MenuItem id="news" icon={Newspaper} label="จัดการข่าว" />
          <MenuItem id="users" icon={Users} label="ผู้ใช้งาน" />
          <MenuItem id="reports" icon={AlertTriangle} label="แจ้งปัญหา" />
        </nav>
        <div className="p-4 border-t dark:border-slate-700">
          <button onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><LogOut size={20} /> <span className="font-medium">ออกระบบ</span></button>
        </div>
      </aside>

      {/* 3. Main Content */}
      <div className="flex-1 flex flex-col h-screen w-full overflow-hidden">
        <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 flex justify-between items-center z-10 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg lg:hidden text-gray-600 dark:text-white"><Menu size={24} /></button>
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 hidden lg:block">{activeTab === 'overview' ? 'แดชบอร์ดภาพรวม' : activeTab === 'news' ? 'จัดการข่าวสาร' : activeTab === 'users' ? 'จัดการผู้ใช้งาน' : 'รายการแจ้งปัญหา'}</h2>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">A</div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-slate-900 scroll-smooth">
          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div id="report-content" className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center"><h2 className="text-xl md:text-2xl font-bold dark:text-white">📊 ภาพรวมระบบ</h2><button onClick={handleExportPDF} className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm flex gap-2"><FileText size={18} /> PDF</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-blue-500"><p className="text-gray-500 text-sm">ข่าวทั้งหมด</p><h3 className="text-3xl font-bold dark:text-white">{newsList.length}</h3></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-green-500"><p className="text-gray-500 text-sm">ผู้ใช้งาน</p><h3 className="text-3xl font-bold dark:text-white">{users.length}</h3></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500"><p className="text-gray-500 text-sm">แจ้งปัญหา</p><h3 className="text-3xl font-bold dark:text-white">{reports.filter(r => r.status === 'pending').length}</h3></div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm"><h3 className="font-bold mb-4 dark:text-white">สถิติยอดวิว (Top 5)</h3><Chart options={chartOptions} series={chartSeries} type="bar" height={300} /></div>
            </div>
          )}

          {/* Tab: News */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center"><h2 className="text-xl md:text-2xl font-bold dark:text-white">📰 ข่าวสาร</h2><button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex gap-2 shadow-lg hover:bg-blue-700"><Plus size={18} /> เพิ่มข่าว</button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {newsList.map((news) => (
                  <div key={news.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border dark:border-slate-700 flex flex-col">
                    <div className="h-40 relative bg-gray-200">
                      {news.image_url ? <img src={news.image_url} className="w-full h-full object-cover" onError={(e)=>e.target.style.display='none'}/> : <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon/></div>}
                      <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{news.view_count} วิว</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 w-fit rounded mb-2">{news.category_name || 'ทั่วไป'}</span>
                      <h3 className="font-bold text-gray-800 dark:text-white line-clamp-2 mb-2">{news.title}</h3>
                      <div className="mt-auto pt-3 border-t dark:border-slate-700 flex justify-end gap-2">
                         <button onClick={() => handleOpenModal(news)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"><Edit size={18}/></button>
                         <button onClick={() => handleDeleteNews(news.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Tab: Users & Reports (โค้ดเหมือนเดิม ใส่ไว้ให้ครบ Flow) */}
          {activeTab === 'users' && (<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="p-5 border-b dark:border-slate-700"><h2 className="text-xl font-bold dark:text-white">👥 ผู้ใช้งาน</h2></div>
              <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y dark:divide-slate-700">{users.map(u => (<tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-750"><td className="p-4"><p className="font-bold dark:text-white">{u.first_name}</p><p className="text-xs text-gray-500">{u.email}</p></td><td className="p-4"><span className="bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-xs">{u.role}</span></td><td className="p-4">{u.is_banned ? <span className="text-red-500 text-xs font-bold">Banned</span> : <span className="text-green-500 text-xs font-bold">Active</span>}</td><td className="p-4 flex justify-center gap-2">{u.role!=='admin'&&(<> <button onClick={()=>handleBanUser(u.id,u.is_banned)} className={`px-2 py-1 rounded text-xs text-white ${u.is_banned?'bg-green-500':'bg-orange-500'}`}>{u.is_banned?'ปลด':'แบน'}</button> <button onClick={()=>handleDeleteUser(u.id)} className="px-2 py-1 rounded text-xs bg-red-500 text-white">ลบ</button> </>)}</td></tr>))}</tbody></table></div></div>)}
          {activeTab === 'reports' && (<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300"><div className="p-5 border-b dark:border-slate-700"><h2 className="text-xl font-bold dark:text-white">⚠️ แจ้งปัญหา</h2></div><div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-yellow-50 dark:bg-slate-700"><tr><th className="p-4">Topic</th><th className="p-4">Detail</th><th className="p-4">Status</th><th className="p-4">Update</th></tr></thead><tbody className="divide-y dark:divide-slate-700">{reports.map(r=>(<tr key={r.id}><td className="p-4 font-bold dark:text-white">{r.topic}</td><td className="p-4 text-sm dark:text-gray-400 max-w-xs truncate">{r.description}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${r.status==='pending'?'bg-yellow-100 text-yellow-700':r.status==='resolved'?'bg-green-100 text-green-700':'bg-gray-100'}`}>{r.status}</span></td><td className="p-4"><select value={r.status} onChange={(e)=>handleUpdateReport(r.id,e.target.value)} className="border rounded p-1 text-xs dark:bg-slate-600 dark:text-white"><option value="pending">รอ</option><option value="resolved">เสร็จ</option><option value="closed">ปิด</option></select></td></tr>))}</tbody></table></div></div>)}
        </main>
      </div>

      {/* --- Modal with Drag & Drop Image Upload --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex gap-2">{isEditMode?<Edit/>:<Plus/>} {isEditMode?'แก้ไข':'เพิ่ม'}ข่าว</h3>
              <button onClick={()=>setIsModalOpen(false)} className="hover:bg-blue-700 rounded-full p-1"><X/></button>
            </div>
            <form onSubmit={handleNewsSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <input type="text" placeholder="หัวข้อข่าว" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.title} onChange={(e)=>setNewsForm({...newsForm,title:e.target.value})}/>
                  <select className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.category_id} onChange={(e)=>setNewsForm({...newsForm,category_id:e.target.value})}>
                     {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {/* ✅ Drag & Drop Image Area */}
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">รูปภาพปกข่าว</label>
                  <div 
                    className={`h-32 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden 
                    ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-slate-600' : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                  >
                    {newsForm.image_url ? (
                      <>
                        <img src={newsForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={(e)=>{e.stopPropagation(); removeImage();}} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"><X size={14}/></button>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="text-gray-400 mb-2" size={32} />
                        <p className="text-xs text-gray-500 dark:text-gray-400">ลากไฟล์รูปมาวาง หรือคลิก</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </div>
                  {/* ช่องใส่ URL เผื่ออยากก็อปวาง */}
                  <input type="text" placeholder="หรือวาง URL รูปภาพที่นี่..." className="w-full mt-2 p-1 text-xs border-b bg-transparent dark:text-gray-400 focus:outline-none" value={newsForm.image_url} onChange={(e)=>setNewsForm({...newsForm,image_url:e.target.value})}/>
                </div>
              </div>

              <textarea rows="5" placeholder="เนื้อหาข่าว..." required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.content} onChange={(e)=>setNewsForm({...newsForm,content:e.target.value})}></textarea>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}