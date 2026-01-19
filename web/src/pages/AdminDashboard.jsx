import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';
import { Editor } from '@tinymce/tinymce-react'; // ✅ Import TinyMCE
import { 
  LayoutDashboard, Newspaper, Users, AlertTriangle, LogOut, 
  Menu, X, Plus, Image as ImageIcon, Edit, Trash2, FileText, UploadCloud,
  Tags
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fileInputRef = useRef(null);
  const editorRef = useRef(null); // ✅ Ref สำหรับ Editor
  
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // --- Forms ---
  const [currentId, setCurrentId] = useState(null); 
  const [newsForm, setNewsForm] = useState({
    title: '', content: '', category_id: '', image_url: '', author_name: ''
  });
  const [catForm, setCatForm] = useState({ name: '' });

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
      console.error(error); 
      setLoading(false); 
    }
  };

  // --- Image Upload Handlers ---
  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
  
  const processFile = (file) => {
    if (!file.type.startsWith('image/')) return Swal.fire('ผิดประเภท', 'รูปภาพเท่านั้น', 'error');
    if (file.size > 5 * 1024 * 1024) return Swal.fire('ไฟล์ใหญ่ไป', 'ขนาดไม่เกิน 5MB', 'warning');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => setNewsForm(prev => ({ ...prev, image_url: reader.result }));
  };
  
  const removeImage = () => { setNewsForm(prev => ({ ...prev, image_url: '' })); if (fileInputRef.current) fileInputRef.current.value = ""; };

  // --- News Handlers ---
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
      // ✅ ดึงค่าจาก TinyMCE
      const content = editorRef.current ? editorRef.current.getContent() : newsForm.content;
      
      const payload = { ...newsForm, content }; // ใช้ content จาก Editor
      const url = isEditMode ? `${apiUrl}/api/news/${currentId}` : `${apiUrl}/api/news`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
      if (res.ok) { setIsModalOpen(false); fetchData(); Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success'); }
      else throw new Error();
    } catch (err) { Swal.fire('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ', 'error'); }
  };
  
  const handleDeleteNews = async (id) => {
     if ((await Swal.fire({ title: 'ลบข่าว?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })).isConfirmed) {
        await fetch(`${apiUrl}/api/news/${id}`, { method: 'DELETE' }); fetchData();
     }
  };

  // --- Categories & Users Handlers (ย่อไว้เหมือนเดิม) ---
  const handleOpenCatModal = (item = null) => { if(item){setIsEditMode(true);setCurrentId(item.id);setCatForm({name:item.name});}else{setIsEditMode(false);setCurrentId(null);setCatForm({name:''});} setIsCatModalOpen(true); };
  const handleCatSubmit = async (e) => { e.preventDefault(); try{ const url=isEditMode?`${apiUrl}/api/news/categories/${currentId}`:`${apiUrl}/api/news/categories`; const method=isEditMode?'PUT':'POST'; await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(catForm)}); setIsCatModalOpen(false); fetchData(); Swal.fire('Success','Saved','success'); }catch(e){Swal.fire('Error','Failed','error');} };
  const handleDeleteCat = async (id) => { const r=await fetch(`${apiUrl}/api/news/categories/${id}`,{method:'DELETE'}); if(r.ok){fetchData();Swal.fire('Deleted','Success','success');}else{Swal.fire('Error','Cannot delete','error');} };
  const handleBanUser = async (id, s) => { if(!s){const{value:r}=await Swal.fire({title:'Reason',input:'text',showCancelButton:true,confirmButtonColor:'#d33'});if(r)await updateBan(id,true,r);}else{await updateBan(id,false,null);} };
  const updateBan = async (id,s,r) => { await fetch(`${apiUrl}/api/admin/users/${id}/ban`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_banned:s,ban_reason:r})}); fetchData(); };
  const handleDeleteUser = async (id) => { if((await Swal.fire({title:'Delete?',icon:'warning',showCancelButton:true,confirmButtonColor:'#d33'})).isConfirmed){await fetch(`${apiUrl}/api/admin/users/${id}`,{method:'DELETE'});fetchData();} };
  const handleUpdateReport = async (id,s) => { await fetch(`${apiUrl}/api/admin/reports/${id}/status`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})}); fetchData(); };
  const handleExportPDF = () => html2pdf().from(document.getElementById('report-content')).save('report.pdf');

  const MenuItem = ({ id, icon: Icon, label }) => (<button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}><Icon size={20} /> <span className="font-medium">{label}</span></button>);

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-900 font-sarabun overflow-hidden relative">
      {isMobileMenuOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center"><div className="flex items-center gap-2"><div className="bg-blue-600 p-2 rounded text-white"><LayoutDashboard size={20}/></div><h1 className="font-bold text-lg dark:text-white">Admin</h1></div><button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500"><X/></button></div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MenuItem id="overview" icon={LayoutDashboard} label="ภาพรวม" />
          <MenuItem id="news" icon={Newspaper} label="จัดการข่าว" />
          <MenuItem id="categories" icon={Tags} label="จัดการหมวดหมู่" />
          <MenuItem id="users" icon={Users} label="ผู้ใช้งาน" />
          <MenuItem id="reports" icon={AlertTriangle} label="แจ้งปัญหา" />
        </nav>
        <div className="p-4 border-t dark:border-slate-700"><button onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }} className="w-full flex gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg"><LogOut/> <span>ออกระบบ</span></button></div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center z-10 shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-white"><Menu/></button>
          <h2 className="font-bold dark:text-white hidden lg:block">{activeTab.toUpperCase()}</h2>
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">A</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-slate-900 scroll-smooth">
            {activeTab === 'overview' && <div id="report-content" className="space-y-6"><div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">📊 ภาพรวม</h2><button onClick={handleExportPDF} className="bg-gray-700 text-white px-3 py-2 rounded flex gap-2"><FileText/> PDF</button></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-blue-500"><h3>ข่าว {newsList.length}</h3></div><div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-purple-500"><h3>หมวด {categories.length}</h3></div><div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-green-500"><h3>User {users.length}</h3></div><div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500"><h3>แจ้ง {reports.filter(r=>r.status==='pending').length}</h3></div></div><div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm"><Chart options={{chart:{id:'views',toolbar:{show:false}},xaxis:{categories:newsList.slice(0,5).map(n=>n.title.substring(0,10))}}} series={[{name:'Views',data:newsList.slice(0,5).map(n=>n.view_count)}]} type="bar" height={300}/></div></div>}
            
            {activeTab === 'news' && <div className="space-y-6"><div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">📰 จัดการข่าว</h2><button onClick={()=>handleOpenNewsModal()} className="bg-blue-600 text-white px-3 py-2 rounded flex gap-2"><Plus/> เพิ่มข่าว</button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{newsList.map(n=><div key={n.id} className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden"><div className="h-40 relative bg-gray-200">{n.image_url&&<img src={n.image_url} className="w-full h-full object-cover"/>}</div><div className="p-4"><h3 className="font-bold dark:text-white line-clamp-2">{n.title}</h3><div className="mt-3 flex justify-end gap-2"><button onClick={()=>handleOpenNewsModal(n)} className="text-yellow-600 p-2"><Edit/></button><button onClick={()=>handleDeleteNews(n.id)} className="text-red-600 p-2"><Trash2/></button></div></div></div>)}</div></div>}

            {activeTab === 'categories' && <div className="space-y-6"><div className="flex justify-between"><h2 className="text-2xl font-bold dark:text-white">🏷️ หมวดหมู่</h2><button onClick={()=>handleOpenCatModal()} className="bg-purple-600 text-white px-3 py-2 rounded flex gap-2"><Plus/> เพิ่ม</button></div><div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden"><table className="w-full text-left"><thead className="bg-purple-50 dark:bg-slate-700"><tr><th className="p-4">Name</th><th className="p-4 text-center">Action</th></tr></thead><tbody className="divide-y dark:divide-slate-700">{categories.map(c=><tr key={c.id}><td className="p-4 dark:text-white">{c.name}</td><td className="p-4 flex justify-center gap-2"><button onClick={()=>handleOpenCatModal(c)} className="text-yellow-600">Edit</button><button onClick={()=>handleDeleteCat(c.id)} className="text-red-600">Delete</button></td></tr>)}</tbody></table></div></div>}
            
            {activeTab === 'users' && <div className="bg-white dark:bg-slate-800 rounded shadow overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-100 dark:bg-slate-700"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Reason</th><th className="p-4">Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-t dark:border-slate-700"><td className="p-4 dark:text-white">{u.first_name}</td><td className="p-4 dark:text-gray-300">{u.role}</td><td className="p-4">{u.is_banned?<span className="text-red-500">Banned</span>:<span className="text-green-500">Active</span>}</td><td className="p-4 text-xs text-red-400">{u.ban_reason||'-'}</td><td className="p-4">{u.role!=='admin'&&<button onClick={()=>handleBanUser(u.id,u.is_banned)} className="text-xs border px-2 py-1 rounded">{u.is_banned?'Unlock':'Ban'}</button>}</td></tr>)}</tbody></table></div>}
            
            {activeTab === 'reports' && <div className="bg-white dark:bg-slate-800 rounded shadow overflow-x-auto"><table className="w-full text-left"><thead className="bg-yellow-50 dark:bg-slate-700"><tr><th className="p-4">Topic</th><th className="p-4">Status</th><th className="p-4">Update</th></tr></thead><tbody>{reports.map(r=><tr key={r.id} className="border-t dark:border-slate-700"><td className="p-4 dark:text-white">{r.topic}</td><td className="p-4">{r.status}</td><td className="p-4"><select onChange={(e)=>handleUpdateReport(r.id,e.target.value)} value={r.status} className="border rounded text-xs p-1"><option value="pending">Pending</option><option value="resolved">Resolved</option></select></td></tr>)}</tbody></table></div>}
        </main>
      </div>

      {/* --- News Modal (Updated with TinyMCE) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col">
                <div className="bg-blue-600 p-4 text-white flex justify-between shrink-0"><h3 className="font-bold">จัดการข่าวสาร</h3><button onClick={()=>setIsModalOpen(false)}><X/></button></div>
                <form onSubmit={handleNewsSubmit} className="p-6 space-y-4">
                    <input type="text" placeholder="หัวข้อข่าว" required className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.title} onChange={e=>setNewsForm({...newsForm, title:e.target.value})}/>
                    <select className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={newsForm.category_id} onChange={e=>setNewsForm({...newsForm, category_id:e.target.value})}>
                        {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className={`h-40 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer relative ${dragActive?'border-blue-500 bg-blue-50':''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={()=>fileInputRef.current.click()}>
                        {newsForm.image_url ? <><img src={newsForm.image_url} className="h-full w-full object-cover rounded"/><button type="button" onClick={(e)=>{e.stopPropagation();removeImage()}} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={14}/></button></> : <div className="text-center text-gray-400"><UploadCloud/><p className="text-xs">Drag Cover Image</p></div>}
                        <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileChange}/>
                    </div>
                    
                    {/* ✅ TinyMCE Editor */}
                    <div className="border rounded-lg overflow-hidden">
                        <Editor
                            apiKey="ty1y0bweonlgsxi46gf4sk9olwcqgnkczuacoq5do8q7dz9p" // ถ้ามี API Key ใส่ตรงนี้ได้เลย (no-api-key จะมี warning นิดหน่อยแต่ใช้ได้)
                            onInit={(evt, editor) => editorRef.current = editor}
                            initialValue={newsForm.content}
                            init={{
                                height: 400,
                                menubar: false,
                                plugins: [
                                   'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                   'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                   'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                ],
                                toolbar: 'undo redo | blocks | ' +
                                   'bold italic forecolor | alignleft aligncenter ' +
                                   'alignright alignjustify | bullist numlist outdent indent | ' +
                                   'removeformat | image media | help',
                                content_style: 'body { font-family:Sarabun,Helvetica,Arial,sans-serif; font-size:14px }'
                            }}
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">บันทึกข่าว</button>
                </form>
            </div>
        </div>
      )}
      
      {/* Category Modal */}
      {isCatModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
                 <h3 className="font-bold dark:text-white">จัดการหมวดหมู่</h3>
                 <input type="text" placeholder="ชื่อหมวดหมู่" className="w-full p-2 border rounded dark:bg-slate-700 dark:text-white" value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})}/>
                 <div className="flex justify-end gap-2"><button onClick={()=>setIsCatModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">ยกเลิก</button><button onClick={handleCatSubmit} className="px-4 py-2 bg-purple-600 text-white rounded">บันทึก</button></div>
             </div>
         </div>
      )}
    </div>
  );
}