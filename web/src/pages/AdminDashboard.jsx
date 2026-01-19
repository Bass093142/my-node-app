import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, Newspaper, Users, AlertTriangle, LogOut, 
  Menu, X, Plus, Image as ImageIcon, Edit, Trash2, FileText, UploadCloud,
  Tags, Search
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fileInputRef = useRef(null);
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // --- Data State ---
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Modals State ---
  const [isModalOpen, setIsModalOpen] = useState(false); // News Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false); // Category Modal
  const [isEditMode, setIsEditMode] = useState(false);
  
  // --- Forms ---
  const [currentId, setCurrentId] = useState(null); 
  const [newsForm, setNewsForm] = useState({
    title: '', content: '', category_id: '', image_url: '', author_name: ''
  });
  const [catForm, setCatForm] = useState({ name: '' });

  // 🛡️ Security Check
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

  // 🔄 Fetch All Data
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
      console.error(error); 
      setLoading(false); 
    }
  };

  // --- 📸 Image Upload Handlers ---
  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
  
  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return Swal.fire('ไฟล์ผิดประเภท', 'กรุณาอัปโหลดรูปภาพเท่านั้น', 'error');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setNewsForm({ ...newsForm, image_url: reader.result });
  };
  
  const removeImage = () => { setNewsForm({ ...newsForm, image_url: '' }); if (fileInputRef.current) fileInputRef.current.value = ""; };

  // --- 📰 News Handlers ---
  const handleOpenNewsModal = (item = null) => {
    if (item) {
      setIsEditMode(true); setCurrentId(item.id);
      setNewsForm({ title: item.title, content: item.content, category_id: item.category_id, image_url: item.image_url || '', author_name: item.author_name });
    } else {
      setIsEditMode(false); setCurrentId(null);
      setNewsForm({ title: '', content: '', category_id: categories[0]?.id || '', image_url: '', author_name: 'Admin' });
    }
    setIsModalOpen(true);
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${apiUrl}/api/news/${currentId}` : `${apiUrl}/api/news`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newsForm) });
      if (res.ok) { setIsModalOpen(false); fetchData(); Swal.fire('สำเร็จ', 'บันทึกข้อมูลข่าวสารแล้ว', 'success'); }
    } catch (err) { Swal.fire('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ', 'error'); }
  };
  
  const handleDeleteNews = async (id) => {
     if ((await Swal.fire({ title: 'ยืนยันลบข่าว?', text: 'ไม่สามารถกู้คืนได้', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })).isConfirmed) {
        await fetch(`${apiUrl}/api/news/${id}`, { method: 'DELETE' }); fetchData();
     }
  };

  // --- 🏷️ Categories Handlers (NEW) ---
  const handleOpenCatModal = (item = null) => {
    if (item) { setIsEditMode(true); setCurrentId(item.id); setCatForm({ name: item.name }); } 
    else { setIsEditMode(false); setCurrentId(null); setCatForm({ name: '' }); }
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${apiUrl}/api/news/categories/${currentId}` : `${apiUrl}/api/news/categories`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(catForm) });
      if (res.ok) { setIsCatModalOpen(false); fetchData(); Swal.fire('สำเร็จ', 'บันทึกหมวดหมู่แล้ว', 'success'); }
    } catch (err) { Swal.fire('ผิดพลาด', 'บันทึกหมวดหมู่ไม่สำเร็จ', 'error'); }
  };

  const handleDeleteCat = async (id) => {
    const res = await fetch(`${apiUrl}/api/news/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { fetchData(); Swal.fire('ลบแล้ว', 'ลบหมวดหมู่เรียบร้อย', 'success'); }
    else { Swal.fire('ลบไม่ได้', data.message || 'มีข่าวใช้งานหมวดหมู่นี้อยู่', 'error'); }
  };

  // --- 👥 User & Ban Handlers (With Reason) ---
  const handleBanUser = async (id, currentStatus) => {
    if (!currentStatus) {
        // แบน: ถามเหตุผล
        const { value: reason } = await Swal.fire({
            title: 'ระบุเหตุผลการแบน',
            input: 'text',
            inputLabel: 'เหตุผลนี้จะบันทึกในระบบ',
            inputPlaceholder: 'เช่น ทำผิดกฎชุมชน...',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ยืนยันการแบน'
        });

        if (reason) {
            await updateBanStatus(id, true, reason);
        }
    } else {
        // ปลดแบน: ไม่ต้องถาม
        await updateBanStatus(id, false, null);
    }
  };

  const updateBanStatus = async (id, isBanned, reason) => {
    try {
        await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_banned: isBanned, ban_reason: reason })
        });
        fetchData();
        Swal.fire('เรียบร้อย', isBanned ? 'ระงับการใช้งานผู้ใช้แล้ว' : 'ปลดการระงับผู้ใช้แล้ว', 'success');
    } catch (error) { console.error(error); }
  };

  const handleDeleteUser = async (id) => { 
    if ((await Swal.fire({ title: 'ลบผู้ใช้ถาวร?', text: 'ข้อมูลทั้งหมดจะหายไป', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })).isConfirmed) { 
        await fetch(`${apiUrl}/api/admin/users/${id}`, { method: 'DELETE' }); fetchData(); 
    } 
  };

  // --- ⚠️ Report Handler ---
  const handleUpdateReport = async (id, s) => { 
    await fetch(`${apiUrl}/api/admin/reports/${id}/status`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: s }) }); 
    fetchData(); 
  };
  
  const handleExportPDF = () => { html2pdf().from(document.getElementById('report-content')).save('admin-report.pdf'); };

  // --- Sidebar Component ---
  const MenuItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
      <Icon size={20} /> <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-900 font-sarabun overflow-hidden relative">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2"><div className="bg-blue-600 p-2 rounded text-white"><LayoutDashboard size={20}/></div><h1 className="font-bold text-lg dark:text-white">Admin Panel</h1></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500"><X/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuItem id="overview" icon={LayoutDashboard} label="ภาพรวมระบบ" />
          <MenuItem id="news" icon={Newspaper} label="จัดการข่าวสาร" />
          <MenuItem id="categories" icon={Tags} label="จัดการหมวดหมู่" />
          <MenuItem id="users" icon={Users} label="จัดการผู้ใช้งาน" />
          <MenuItem id="reports" icon={AlertTriangle} label="รายการแจ้งปัญหา" />
        </nav>
        <div className="p-4 border-t dark:border-slate-700"><button onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }} className="w-full flex gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><LogOut/> <span>ออกจากระบบ</span></button></div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center z-10 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-white"><Menu/></button>
          <h2 className="font-bold dark:text-white hidden lg:block text-lg">{activeTab === 'overview' ? 'แดชบอร์ด' : activeTab === 'news' ? 'ข่าวสาร' : activeTab === 'categories' ? 'หมวดหมู่' : activeTab === 'users' ? 'ผู้ใช้งาน' : 'แจ้งปัญหา'}</h2>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">A</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-slate-900 scroll-smooth">
            
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
               <div id="report-content" className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">📊 ภาพรวมระบบ</h2><button onClick={handleExportPDF} className="bg-gray-700 text-white px-3 py-2 rounded flex gap-2 hover:bg-gray-800"><FileText/> Export PDF</button></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-blue-500"><p className="text-gray-500 text-sm">ข่าวทั้งหมด</p><h3 className="text-2xl font-bold dark:text-white">{newsList.length}</h3></div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-purple-500"><p className="text-gray-500 text-sm">หมวดหมู่</p><h3 className="text-2xl font-bold dark:text-white">{categories.length}</h3></div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-green-500"><p className="text-gray-500 text-sm">ผู้ใช้งาน</p><h3 className="text-2xl font-bold dark:text-white">{users.length}</h3></div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500"><p className="text-gray-500 text-sm">รอตรวจสอบ</p><h3 className="text-2xl font-bold dark:text-white">{reports.filter(r=>r.status==='pending').length}</h3></div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm"><h3 className="font-bold mb-4 dark:text-white">สถิติยอดวิวข่าวล่าสุด</h3><Chart options={{ chart: {id:'views', toolbar:{show:false}}, xaxis: {categories: newsList.slice(0,5).map(n=>n.title.substring(0,10)+'...')}, colors:['#3b82f6'] }} series={[{name:'Views', data: newsList.slice(0,5).map(n=>n.view_count)}]} type="bar" height={300} /></div>
               </div>
            )}

            {/* 2. News Tab */}
            {activeTab === 'news' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">📰 จัดการข่าวสาร</h2><button onClick={()=>handleOpenNewsModal()} className="bg-blue-600 text-white px-3 py-2 rounded flex gap-2 hover:bg-blue-700 shadow-lg"><Plus/> เพิ่มข่าวใหม่</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newsList.map(n => (
                            <div key={n.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border dark:border-slate-700 flex flex-col group hover:shadow-md transition-all">
                                <div className="h-40 relative bg-gray-200">
                                    {n.image_url ? <img src={n.image_url} className="w-full h-full object-cover" onError={(e)=>e.target.style.display='none'}/> : <div className="flex h-full items-center justify-center text-gray-400"><ImageIcon/></div>}
                                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">👁️ {n.view_count}</span>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 w-fit rounded mb-2 dark:bg-blue-900/30 dark:text-blue-300">{n.category_name || 'ทั่วไป'}</span>
                                    <h3 className="font-bold dark:text-white line-clamp-2 h-12">{n.title}</h3>
                                    <div className="mt-auto pt-3 border-t dark:border-slate-700 flex justify-end gap-2">
                                        <button onClick={()=>handleOpenNewsModal(n)} className="text-yellow-600 p-2 hover:bg-yellow-50 rounded transition-colors"><Edit size={18}/></button>
                                        <button onClick={()=>handleDeleteNews(n.id)} className="text-red-600 p-2 hover:bg-red-50 rounded transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Categories Tab */}
            {activeTab === 'categories' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">🏷️ จัดการหมวดหมู่</h2><button onClick={()=>handleOpenCatModal()} className="bg-purple-600 text-white px-3 py-2 rounded flex gap-2 hover:bg-purple-700 shadow-lg"><Plus/> เพิ่มหมวดหมู่</button></div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border dark:border-slate-700">
                        <table className="w-full text-left">
                            <thead className="bg-purple-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200"><tr><th className="p-4">ID</th><th className="p-4">ชื่อหมวดหมู่</th><th className="p-4 text-center">จัดการ</th></tr></thead>
                            <tbody className="divide-y dark:divide-slate-700">
                                {categories.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                                        <td className="p-4 text-gray-500">#{c.id}</td>
                                        <td className="p-4 font-bold dark:text-white">{c.name}</td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button onClick={()=>handleOpenCatModal(c)} className="text-yellow-600 bg-yellow-50 px-3 py-1 rounded text-xs hover:bg-yellow-100">แก้ไข</button>
                                            <button onClick={()=>handleDeleteCat(c.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded text-xs hover:bg-red-100">ลบ</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-x-auto border dark:border-slate-700 animate-in fade-in">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                            <tr><th className="p-4">ผู้ใช้งาน</th><th className="p-4">Role</th><th className="p-4">สถานะ</th><th className="p-4">เหตุผลแบน</th><th className="p-4 text-center">จัดการ</th></tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {u.profile_image ? <img src={u.profile_image} className="w-10 h-10 rounded-full object-cover border"/> : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{u.first_name[0]}</div>}
                                            <div><p className="font-bold dark:text-white">{u.first_name} {u.last_name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                                        </div>
                                    </td>
                                    <td className="p-4 dark:text-gray-300"><span className="bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded text-xs">{u.role}</span></td>
                                    <td className="p-4">{u.is_banned ? <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs font-bold">ถูกระงับ</span> : <span className="text-green-500 bg-green-50 px-2 py-1 rounded text-xs font-bold">ปกติ</span>}</td>
                                    <td className="p-4 text-xs text-red-500 italic max-w-xs truncate">{u.ban_reason || '-'}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        {u.role!=='admin'&&(<>
                                            <button onClick={()=>handleBanUser(u.id,u.is_banned)} className={`px-2 py-1 rounded text-xs text-white ${u.is_banned?'bg-green-500':'bg-orange-500 hover:bg-orange-600'}`}>{u.is_banned?'ปลดแบน':'แบน'}</button>
                                            <button onClick={()=>handleDeleteUser(u.id)} className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600">ลบ</button>
                                        </>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 5. Reports Tab */}
            {activeTab === 'reports' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-x-auto border dark:border-slate-700 animate-in fade-in">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-yellow-50 dark:bg-slate-700"><tr><th className="p-4">หัวข้อ</th><th className="p-4">ผู้แจ้ง</th><th className="p-4">รายละเอียด</th><th className="p-4">สถานะ</th><th className="p-4">อัปเดตงาน</th></tr></thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {reports.map(r=>(
                                <tr key={r.id}>
                                    <td className="p-4 font-bold dark:text-white">{r.topic}</td>
                                    <td className="p-4 text-sm dark:text-gray-400">{r.first_name}<br/>({r.email})</td>
                                    <td className="p-4 text-sm dark:text-gray-300 max-w-xs truncate">{r.description}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${r.status==='pending'?'bg-yellow-100 text-yellow-700':r.status==='resolved'?'bg-green-100 text-green-700':'bg-gray-100'}`}>{r.status}</span></td>
                                    <td className="p-4"><select onChange={(e)=>handleUpdateReport(r.id,e.target.value)} value={r.status} className="border rounded text-xs p-1 dark:bg-slate-600 dark:text-white"><option value="pending">รอตรวจสอบ</option><option value="resolved">แก้ไขแล้ว</option><option value="closed">ปิดงาน</option></select></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
      </div>

      {/* --- News Modal (Add/Edit) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="bg-blue-600 p-4 text-white flex justify-between shrink-0"><h3 className="font-bold flex gap-2">{isEditMode?<Edit/>:<Plus/>} {isEditMode?'แก้ไขข่าวสาร':'เพิ่มข่าวใหม่'}</h3><button onClick={()=>setIsModalOpen(false)} className="hover:bg-blue-700 rounded-full p-1"><X/></button></div>
                <form onSubmit={handleNewsSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" placeholder="หัวข้อข่าว" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.title} onChange={e=>setNewsForm({...newsForm, title:e.target.value})}/>
                    <select className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.category_id} onChange={e=>setNewsForm({...newsForm, category_id:e.target.value})}>
                        {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {/* Image Upload Area */}
                    <div>
                        <label className="block text-sm mb-1 dark:text-gray-300">รูปภาพปกข่าว</label>
                        <div className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer relative transition-colors ${dragActive?'border-blue-500 bg-blue-50 dark:bg-slate-700':'border-gray-300 dark:border-slate-600'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={()=>fileInputRef.current.click()}>
                            {newsForm.image_url ? <><img src={newsForm.image_url} className="h-full w-full object-cover rounded-lg"/><button type="button" onClick={(e)=>{e.stopPropagation();removeImage()}} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><X size={16}/></button></> : <div className="text-center text-gray-400"><UploadCloud size={32} className="mx-auto mb-2"/><p className="text-sm">ลากรูปมาวาง หรือคลิกเพื่ออัปโหลด</p></div>}
                            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange}/>
                        </div>
                    </div>
                    <textarea rows="6" placeholder="เนื้อหาข่าว..." required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.content} onChange={e=>setNewsForm({...newsForm, content:e.target.value})}/>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md">บันทึกข้อมูล</button>
                </form>
            </div>
        </div>
      )}

      {/* --- Category Modal --- */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                <div className="bg-purple-600 p-4 text-white flex justify-between"><h3 className="font-bold flex gap-2">{isEditMode?<Edit/>:<Plus/>} {isEditMode?'แก้ไขหมวดหมู่':'เพิ่มหมวดหมู่'}</h3><button onClick={()=>setIsCatModalOpen(false)} className="hover:bg-purple-700 rounded-full p-1"><X/></button></div>
                <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
                    <label className="block text-sm font-medium dark:text-white">ชื่อหมวดหมู่</label>
                    <input type="text" placeholder="เช่น กีฬา, การเมือง" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})}/>
                    <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-bold">บันทึก</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}