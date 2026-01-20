import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';
import { Editor } from '@tinymce/tinymce-react'; 
import { 
  LayoutDashboard, Newspaper, Users, AlertTriangle, LogOut, 
  Menu, X, Plus, Image as ImageIcon, Edit, Trash2, FileText, UploadCloud, Tags
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // --- Data State ---
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Modals ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null); 
  
  // --- Forms ---
  const [newsForm, setNewsForm] = useState({ title: '', content: '', category_id: '', image_url: '', author_name: '' });
  const [catForm, setCatForm] = useState({ name: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      Swal.fire('Access Denied', 'เฉพาะแอดมินเท่านั้น', 'error');
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
    } catch (error) { console.error(error); setLoading(false); }
  };

  const filterByMonth = (data) => data.filter(item => new Date(item.created_at).getMonth() === selectedMonth);
  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type==="dragenter"||e.type==="dragover") setDragActive(true); else setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return Swal.fire('ผิดประเภท', 'ใช้รูปภาพเท่านั้น', 'error');
    if (file.size > 5 * 1024 * 1024) return Swal.fire('ไฟล์ใหญ่ไป', 'ขนาดไม่เกิน 5MB', 'warning');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setNewsForm(prev => ({ ...prev, image_url: reader.result }));
  };
  const removeImage = () => { setNewsForm(prev => ({ ...prev, image_url: '' })); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const content = editorRef.current ? editorRef.current.getContent() : newsForm.content;
      const payload = { ...newsForm, content };
      const url = isEditMode ? `${apiUrl}/api/news/${currentId}` : `${apiUrl}/api/news`;
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
      if (res.ok) { setIsModalOpen(false); fetchData(); Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success'); }
    } catch (err) { Swal.fire('ผิดพลาด', 'บันทึกไม่สำเร็จ', 'error'); }
  };
  const handleDeleteNews = async (id) => { if((await Swal.fire({title:'ลบข่าว?',icon:'warning',showCancelButton:true,confirmButtonColor:'#d33'})).isConfirmed){ await fetch(`${apiUrl}/api/news/${id}`,{method:'DELETE'}); fetchData(); }};
  const handleOpenNewsModal = (item) => { if(item){setIsEditMode(true);setCurrentId(item.id);setNewsForm(item);}else{setIsEditMode(false);setCurrentId(null);setNewsForm({title:'',content:'',category_id:categories[0]?.id||'',image_url:'',author_name:'Admin'});} setIsModalOpen(true); };
  const handleCatSubmit = async (e) => { e.preventDefault(); const url=isEditMode?`${apiUrl}/api/news/categories/${currentId}`:`${apiUrl}/api/news/categories`; const method=isEditMode?'PUT':'POST'; await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(catForm)}); setIsCatModalOpen(false); fetchData(); };
  const handleDeleteCat = async (id) => { const r=await fetch(`${apiUrl}/api/news/categories/${id}`,{method:'DELETE'}); if(r.ok) fetchData(); else Swal.fire('ลบไม่ได้', 'มีข่าวอยู่ในหมวดหมู่นี้', 'error'); };
  const handleBanUser = async (id, s) => { if(!s){const{value:r}=await Swal.fire({title:'ระบุเหตุผลการแบน',input:'text',showCancelButton:true,confirmButtonColor:'#d33'});if(r)await updateBan(id,true,r);}else{await updateBan(id,false,null);} };
  const updateBan = async (id,s,r) => { await fetch(`${apiUrl}/api/admin/users/${id}/ban`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_banned:s,ban_reason:r})}); fetchData(); };
  const handleDeleteUser = async (id) => { if((await Swal.fire({title:'ลบผู้ใช้?',icon:'warning',showCancelButton:true,confirmButtonColor:'#d33'})).isConfirmed){await fetch(`${apiUrl}/api/admin/users/${id}`,{method:'DELETE'});fetchData();} };
  
  const handleUpdateReport = async (id, s) => { 
      try {
        const res = await fetch(`${apiUrl}/api/admin/reports/${id}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: s })
        });
        if(res.ok) {
            fetchData();
            const toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 2000});
            toast.fire({icon: 'success', title: `สถานะอัปเดตเป็น: ${s}`});
        }
      } catch (e) { console.error(e); }
  };
  
  const handleExportPDF = () => html2pdf().from(document.getElementById('report-content')).save('admin-report.pdf');

  // --- Prepare Chart Data ---
  const filteredNews = filterByMonth(newsList);
  const filteredReports = filterByMonth(reports);
  const filteredUsers = filterByMonth(users);

  // ข้อมูลสำหรับกราฟ
  const viewSeries = categories.map(c => filteredNews.filter(n => n.category_id === c.id).reduce((sum, n) => sum + (n.view_count || 0), 0));
  const countSeries = categories.map(c => filteredNews.filter(n => n.category_id === c.id).length);

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-900 font-sarabun overflow-hidden relative">
      {isMobileMenuOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center"><div className="flex items-center gap-2"><div className="bg-blue-600 p-2 rounded text-white"><LayoutDashboard size={20}/></div><h1 className="font-bold text-lg dark:text-white">Admin</h1></div><button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500"><X/></button></div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[{id:'overview',icon:LayoutDashboard,l:'ภาพรวม'},{id:'news',icon:Newspaper,l:'จัดการข่าว'},{id:'categories',icon:Tags,l:'หมวดหมู่'},{id:'users',icon:Users,l:'ผู้ใช้งาน'},{id:'reports',icon:AlertTriangle,l:'แจ้งปัญหา'}].map(m=>(
                <button key={m.id} onClick={()=>{setActiveTab(m.id);setIsMobileMenuOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab===m.id?'bg-blue-600 text-white shadow-md':'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}><m.icon size={20}/><span className="font-medium">{m.l}</span></button>
            ))}
        </nav>
        <div className="p-4 border-t dark:border-slate-700"><button onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }} className="w-full flex gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg"><LogOut/> <span>ออกจากระบบ</span></button></div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center z-10 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-white"><Menu/></button>
          <h2 className="font-bold dark:text-white hidden lg:block text-lg uppercase">{activeTab}</h2>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">A</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-slate-900 scroll-smooth">
            
            {/* 📊 OVERVIEW TAB */}
            {activeTab === 'overview' && (
               <div id="report-content" className="space-y-6 animate-in fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <h2 className="text-2xl font-bold dark:text-white">📊 แดชบอร์ด</h2>
                      <div className="flex gap-2">
                          <select value={selectedMonth} onChange={(e)=>setSelectedMonth(parseInt(e.target.value))} className="p-2 border rounded-lg bg-white dark:bg-slate-700 dark:text-white shadow-sm">
                             {['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map((m,i)=><option key={i} value={i}>{m}</option>)}
                          </select>
                          <button onClick={handleExportPDF} className="bg-gray-700 text-white px-3 py-2 rounded flex gap-2 hover:bg-gray-800"><FileText/> PDF</button>
                      </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-blue-500"><p className="text-gray-500 text-sm">ข่าวในเดือนนี้</p><h3 className="text-2xl font-bold dark:text-white">{filteredNews.length}</h3></div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-purple-500"><p className="text-gray-500 text-sm">ยอดวิวเดือนนี้</p><h3 className="text-2xl font-bold dark:text-white">{filteredNews.reduce((a,b)=>a+(b.view_count||0),0)}</h3></div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-green-500"><p className="text-gray-500 text-sm">ผู้ใช้ใหม่</p><h3 className="text-2xl font-bold dark:text-white">{filteredUsers.length}</h3></div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500"><p className="text-gray-500 text-sm">แจ้งปัญหา</p><h3 className="text-2xl font-bold dark:text-white">{filteredReports.length}</h3></div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm">
                          <h3 className="font-bold mb-4 dark:text-white">ยอดวิวแยกรายหมวดหมู่</h3>
                          <Chart type="bar" height={300} options={{ chart:{toolbar:{show:false}}, xaxis:{categories:categories.map(c=>c.name)}, colors:['#3b82f6'] }} series={[{name:'Views',data:viewSeries}]} />
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm">
                          <h3 className="font-bold mb-4 dark:text-white">สัดส่วนจำนวนข่าว</h3>
                          <Chart type="donut" height={300} options={{ labels:categories.map(c=>c.name), colors:['#3b82f6','#8b5cf6','#10b981','#f59e0b'] }} series={countSeries} />
                      </div>
                      
                      {/* ✅ กราฟเขียวที่คุณต้องการ (Area Chart) */}
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm lg:col-span-2">
                          <h3 className="font-bold mb-4 dark:text-white">แนวโน้มยอดวิวรายสัปดาห์ (ภาพรวม)</h3>
                          <Chart 
                            type="area" 
                            height={300} 
                            options={{ 
                                chart:{toolbar:{show:false}}, 
                                xaxis:{categories:['Week 1','Week 2','Week 3','Week 4']}, 
                                stroke:{curve:'smooth'}, 
                                colors:['#10b981'], // สีเขียว
                                fill: {
                                    type: 'gradient',
                                    gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9, stops: [0, 90, 100] }
                                }
                            }} 
                            series={[{name:'Views',data:[30,40,35,50]}]} 
                          />
                      </div>
                  </div>
               </div>
            )}

            {/* 📰 NEWS TAB */}
            {activeTab === 'news' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">📰 จัดการข่าว</h2><button onClick={()=>handleOpenNewsModal(null)} className="bg-blue-600 text-white px-3 py-2 rounded flex gap-2"><Plus/> เพิ่มข่าว</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{newsList.map(n=><div key={n.id} className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden border dark:border-slate-700 flex flex-col"><div className="h-40 relative bg-gray-200">{n.image_url&&<img src={n.image_url} className="w-full h-full object-cover"/>}</div><div className="p-4 flex-1"><h3 className="font-bold dark:text-white line-clamp-2">{n.title}</h3><div className="mt-3 flex justify-end gap-2"><button onClick={()=>handleOpenNewsModal(n)} className="text-yellow-600 p-2"><Edit size={18}/></button><button onClick={()=>handleDeleteNews(n.id)} className="text-red-600 p-2"><Trash2 size={18}/></button></div></div></div>)}</div>
                </div>
            )}

            {/* 🏷️ CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">🏷️ หมวดหมู่</h2><button onClick={()=>{setIsCatModalOpen(true);setIsEditMode(false);setCatForm({name:''})}} className="bg-purple-600 text-white px-3 py-2 rounded flex gap-2"><Plus/> เพิ่ม</button></div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden"><table className="w-full text-left"><thead className="bg-purple-50 dark:bg-slate-700"><tr><th className="p-4">Name</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y dark:divide-slate-700">{categories.map(c=><tr key={c.id}><td className="p-4 dark:text-white">{c.name}</td><td className="p-4 flex justify-center gap-2"><button onClick={()=>{setIsCatModalOpen(true);setIsEditMode(true);setCurrentId(c.id);setCatForm({name:c.name})}} className="text-yellow-600">Edit</button><button onClick={()=>handleDeleteCat(c.id)} className="text-red-600">Delete</button></td></tr>)}</tbody></table></div>
                </div>
            )}

            {/* 👥 USERS TAB */}
            {activeTab === 'users' && <div className="bg-white dark:bg-slate-800 rounded shadow overflow-x-auto"><table className="w-full text-left min-w-[700px]"><thead className="bg-gray-100 dark:bg-slate-700"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Reason</th><th className="p-4">Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-t dark:border-slate-700"><td className="p-4 flex items-center gap-2">{u.profile_image?<img src={u.profile_image} className="w-8 h-8 rounded-full"/>:<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold">{u.first_name[0]}</div>}<div><p className="font-bold dark:text-white">{u.first_name}</p><p className="text-xs text-gray-500">{u.email}</p></div></td><td className="p-4 dark:text-gray-300">{u.role}</td><td className="p-4">{u.is_banned?<span className="text-red-500 font-bold">Banned</span>:<span className="text-green-500">Active</span>}</td><td className="p-4 text-xs text-red-400">{u.ban_reason||'-'}</td><td className="p-4">{u.role!=='admin'&&<button onClick={()=>handleBanUser(u.id,u.is_banned)} className="text-xs border px-2 py-1 rounded">{u.is_banned?'Unlock':'Ban'}</button>}</td></tr>)}</tbody></table></div>}
            
            {/* ⚠️ REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-x-auto border dark:border-slate-700 animate-in fade-in">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-yellow-50 dark:bg-slate-700 text-gray-700 dark:text-white">
                            <tr>
                                <th className="p-4 w-1/4">หัวข้อปัญหา</th>
                                <th className="p-4 w-1/4">รายละเอียด</th>
                                <th className="p-4 w-1/5">ผู้แจ้ง</th>
                                <th className="p-4">สถานะปัจจุบัน</th>
                                <th className="p-4">อัปเดตงาน</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {reports.map(r=>(
                                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                                    <td className="p-4 font-bold dark:text-white">{r.topic}</td>
                                    <td className="p-4 text-sm dark:text-gray-400">{r.description}</td>
                                    <td className="p-4 text-sm">
                                        <div className="font-medium dark:text-gray-200">{r.first_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{r.email}</div>
                                        <div className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString('th-TH')}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                            r.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                                            'bg-gray-200 text-gray-600'
                                        }`}>
                                            {r.status === 'pending' ? 'รอตรวจสอบ' : r.status === 'resolved' ? 'แก้ไขแล้ว' : 'ปิดงาน'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <select 
                                            onChange={(e)=>handleUpdateReport(r.id,e.target.value)} 
                                            value={r.status} 
                                            className="border rounded text-sm p-1.5 bg-white dark:bg-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="pending">⏳ รอตรวจสอบ</option>
                                            <option value="resolved">✅ แก้ไขแล้ว</option>
                                            <option value="closed">🔒 ปิดงาน</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col">
                <div className="bg-blue-600 p-4 text-white flex justify-between shrink-0"><h3 className="font-bold">จัดการข่าว</h3><button onClick={()=>setIsModalOpen(false)}><X/></button></div>
                <form onSubmit={handleNewsSubmit} className="p-6 space-y-4">
                    <input type="text" placeholder="Title" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.title} onChange={e=>setNewsForm({...newsForm, title:e.target.value})}/>
                    <select className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.category_id} onChange={e=>setNewsForm({...newsForm, category_id:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <div className={`h-40 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer ${dragActive?'border-blue-500 bg-blue-50':''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={()=>fileInputRef.current.click()}>{newsForm.image_url?<img src={newsForm.image_url} className="h-full w-full object-cover"/>:<div className="text-center"><UploadCloud/><p>Upload Image</p></div>}<input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange}/></div>
                    {/* ✅ ใส่ API KEY ของคุณตรงนี้แล้ว */}
                    <div className="border rounded-lg overflow-hidden">
                        <Editor 
                            apiKey="ty1y0bweonlgsxi46gf4sk9olwcqgnkczuacoq5do8q7dz9p" 
                            onInit={(evt, editor) => editorRef.current = editor} 
                            initialValue={newsForm.content} 
                            init={{ height: 400, menubar: false, plugins: ['image', 'link', 'lists', 'table', 'code'], toolbar: 'undo redo | bold italic | alignleft aligncenter | bullist numlist | link image' }} 
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold">บันทึก</button>
                </form>
            </div>
        </div>
      )}
      {isCatModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-4"><h3 className="font-bold dark:text-white">หมวดหมู่</h3><input type="text" className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})}/><div className="flex justify-end gap-2"><button onClick={()=>setIsCatModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">ยกเลิก</button><button onClick={handleCatSubmit} className="px-4 py-2 bg-purple-600 text-white rounded">บันทึก</button></div></div></div>}
    </div>
  );
}