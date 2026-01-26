import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Calendar, Eye, ArrowRight, ImageOff, MessageSquareWarning, History, Moon, Sun, Globe, X, Search } from 'lucide-react';
import { useConfig } from '../context/ConfigContext'; 

export default function Home() {
  const navigate = useNavigate();
  const { t, theme, toggleTheme, lang, toggleLang } = useConfig();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(''); // ✅ 1. เพิ่ม State สำหรับเก็บคำค้นหา
  const [myReports, setMyReports] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resN, resC] = await Promise.all([fetch(`${apiUrl}/api/news`), fetch(`${apiUrl}/api/news/categories/all`)]);
      setNewsList(await resN.json());
      setCategories(await resC.json());
      
      if (user) {
          const resR = await fetch(`${apiUrl}/api/admin/reports/user/${user.id}`);
          setMyReports(await resR.json());
      }
    } catch (e) { console.error(e); }
  };

  const handleReadNews = (id) => {
    fetch(`${apiUrl}/api/news/${id}/view`, {method:'POST'});
    navigate(`/news/${id}`);
  };

  const stripHtml = (html) => {
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  const handleReportIssue = async () => {
    if (!user) return Swal.fire(t('loginFirst'), '', 'warning').then(()=>navigate('/login'));
    
    const { value: formValues } = await Swal.fire({
        title: t('report'),
        html: `<input id="swal-topic" class="swal2-input" placeholder="${t('reportTopic')}"><textarea id="swal-desc" class="swal2-textarea" placeholder="${t('reportDesc')}"></textarea>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: t('submit'),
        cancelButtonText: t('cancel'),
        preConfirm: () => ({ topic: document.getElementById('swal-topic').value, description: document.getElementById('swal-desc').value })
    });

    if (formValues?.topic) {
        await fetch(`${apiUrl}/api/admin/reports`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: user.id, ...formValues })
        });
        Swal.fire(t('sentSuccess'), '', 'success');
        fetchData();
    }
  };

  // ✅ 2. อัปเกรด Logic การกรองข่าว (กรองทั้งหมวดหมู่ และ คำค้นหา พร้อมกัน)
  const filteredNews = newsList.filter(n => {
      // เงื่อนไขที่ 1: เช็คหมวดหมู่
      const matchesCategory = selectedCategory === 'all' || n.category_id === parseInt(selectedCategory);
      
      // เงื่อนไขที่ 2: เช็คคำค้นหา (ค้นหาจาก Title)
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());

      // ต้องผ่านทั้ง 2 เงื่อนไขถึงจะแสดง
      return matchesCategory && matchesSearch;
  });

  return (
    <div className="font-sarabun min-h-screen pb-20 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Navbar & Tools */}
      <div className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20 px-4 py-3 flex justify-between items-center backdrop-blur-md bg-opacity-90">
         <h1 className="text-xl font-bold dark:text-white flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            🏫 {t('news')}
         </h1>
         <div className="flex gap-3">
             <button onClick={toggleLang} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-white flex items-center gap-1 text-xs font-bold border dark:border-slate-600 transition-all">
                <Globe size={16}/> {lang.toUpperCase()}
             </button>
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-yellow-500 dark:text-yellow-300 transition-transform hover:rotate-12">
                {theme==='light' ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
             {user && <button onClick={()=>setShowReportModal(true)} className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 relative transition-all"><History size={20}/><span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{myReports.length}</span></button>}
             {user ? <button onClick={()=>{localStorage.removeItem('user'); window.location.reload()}} className="text-sm text-red-500 font-bold hover:text-red-700">{t('logout')}</button> : <button onClick={()=>navigate('/login')} className="text-sm text-blue-600 font-bold hover:text-blue-700">{t('login')}</button>}
         </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        
        {/* ✅ 3. เพิ่มช่องค้นหา (Search Bar) */}
        <div className="relative max-w-md mx-auto md:mx-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={20} />
            </div>
            <input 
                type="text"
                placeholder={t('search') || "ค้นหาหัวข้อข่าว..."}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button onClick={()=>setSelectedCategory('all')} className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory==='all'?'bg-blue-600 text-white shadow-lg transform scale-105':'bg-white dark:bg-slate-800 dark:text-white hover:bg-gray-100'}`}>{t('all')}</button>
            {categories.map(c=><button key={c.id} onClick={()=>setSelectedCategory(c.id)} className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory===c.id?'bg-blue-600 text-white shadow-lg transform scale-105':'bg-white dark:bg-slate-800 dark:text-white hover:bg-gray-100'}`}>{c.name}</button>)}
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.length > 0 ? (
                filteredNews.map(n => (
                    <div key={n.id} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-2xl overflow-hidden flex flex-col h-full border border-gray-100 dark:border-slate-700 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="relative w-full h-64 bg-gray-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                            {n.image_url ? 
                            <img src={n.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/> : 
                            <div className="flex flex-col items-center justify-center text-gray-400"><ImageOff size={40}/><span className="text-xs mt-2">No Image</span></div>
                            }
                            <span className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-blue-600 text-xs px-3 py-1 rounded-full shadow-sm font-bold z-10">{n.category_name}</span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                <span className="flex gap-1 items-center"><Calendar size={14}/> {new Date(n.created_at).toLocaleDateString(lang==='th'?'th-TH':'en-US')}</span>
                                <span className="flex gap-1 items-center"><Eye size={14}/> {n.view_count}</span>
                            </div>
                            <h3 className="text-xl font-bold dark:text-white line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">{n.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-5 flex-1 opacity-80 leading-relaxed">{stripHtml(n.content)}</p>
                            <button onClick={()=>handleReadNews(n.id)} className="w-full mt-auto flex justify-center items-center gap-2 bg-gray-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 py-3 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow">{t('readMore')} <ArrowRight size={16}/></button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full text-center py-20 text-gray-400">
                    <p className="text-lg">ไม่พบข่าวที่คุณค้นหา</p>
                </div>
            )}
        </div>
      </div>

      {/* Floating Report Button */}
      <button onClick={handleReportIssue} className="fixed bottom-6 right-6 bg-gradient-to-r from-red-500 to-pink-600 hover:scale-110 text-white p-4 rounded-full shadow-lg transition-transform z-50 flex items-center gap-2 font-bold group animate-bounce-slow">
        <MessageSquareWarning size={28} />
      </button>

      {/* 🧾 Modal: My Reports (Chat Style) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-0 max-h-[85vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2"><History className="text-blue-500"/> {t('myReports')}</h3>
                    <button onClick={()=>setShowReportModal(false)} className="text-gray-400 hover:text-red-500"><X/></button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4 bg-gray-100 dark:bg-slate-900/50 flex-1">
                    {myReports.length === 0 ? <div className="text-center text-gray-400 py-10">No reports history</div> : myReports.map(r => (
                        <div key={r.id} className="flex flex-col gap-2">
                             {/* User Message (Right) */}
                             <div className="self-end max-w-[85%]">
                                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-md">
                                    <p className="font-bold text-xs opacity-80 mb-1">{r.topic}</p>
                                    <p className="text-sm">{r.description}</p>
                                </div>
                                <div className="text-[10px] text-gray-400 text-right mt-1">{new Date(r.created_at).toLocaleDateString()} • {t(r.status)}</div>
                             </div>

                             {/* Admin Reply (Left) */}
                             {r.admin_reply && (
                                <div className="self-start max-w-[85%] flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0">A</div>
                                    <div>
                                        <div className="bg-white dark:bg-slate-700 text-gray-800 dark:text-white p-3 rounded-2xl rounded-tl-sm shadow-md border dark:border-slate-600">
                                            <p className="text-xs font-bold text-blue-500 mb-1">{t('adminReply')}</p>
                                            <p className="text-sm">{r.admin_reply}</p>
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}