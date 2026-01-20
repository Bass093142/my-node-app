import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Calendar, Eye, ArrowRight, ImageOff, MessageSquareWarning } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล User เพื่อใช้ตอนแจ้งปัญหา
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    Promise.all([fetch(`${apiUrl}/api/news`), fetch(`${apiUrl}/api/news/categories/all`)])
      .then(async ([resN, resC]) => { 
          setNewsList(await resN.json()); 
          setCategories(await resC.json()); 
          setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  const handleReadNews = (id) => {
    fetch(`${apiUrl}/api/news/${id}/view`, {method:'POST'});
    navigate(`/news/${id}`);
  };

  const stripHtml = (html) => {
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  // 🚩 ฟังก์ชันเปิด Modal แจ้งปัญหา
  const handleReportIssue = async () => {
    if (!user) {
        return Swal.fire({
            icon: 'warning',
            title: 'กรุณาเข้าสู่ระบบ',
            text: 'คุณต้องล็อกอินก่อนจึงจะสามารถแจ้งปัญหาได้',
            confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) navigate('/login');
        });
    }

    const { value: formValues } = await Swal.fire({
        title: 'แจ้งปัญหาการใช้งาน',
        html:
            '<input id="swal-topic" class="swal2-input" placeholder="หัวข้อปัญหา (เช่น เว็บช้า, ข่าวปลอม)">' +
            '<textarea id="swal-desc" class="swal2-textarea" placeholder="รายละเอียดเพิ่มเติม..."></textarea>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'ส่งเรื่องแจ้งเตือน',
        confirmButtonColor: '#ef4444',
        preConfirm: () => {
            return {
                topic: document.getElementById('swal-topic').value,
                description: document.getElementById('swal-desc').value
            }
        }
    });

    if (formValues) {
        if (!formValues.topic || !formValues.description) {
            return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกหัวข้อและรายละเอียด', 'error');
        }

        try {
            await fetch(`${apiUrl}/api/admin/reports`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: user.id,
                    topic: formValues.topic,
                    description: formValues.description
                })
            });
            Swal.fire('ได้รับเรื่องแล้ว', 'ผู้ดูแลระบบจะตรวจสอบโดยเร็วที่สุด', 'success');
        } catch (error) {
            Swal.fire('Error', 'ส่งข้อมูลไม่สำเร็จ', 'error');
        }
    }
  };

  const filteredNews = selectedCategory === 'all' ? newsList : newsList.filter(n => n.category_id === parseInt(selectedCategory));

  return (
    <div className="font-sarabun space-y-6 pb-20 relative min-h-screen">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4 dark:border-slate-700">
        <h2 className="text-2xl font-bold dark:text-white border-l-4 border-blue-600 pl-3">ข่าวประชาสัมพันธ์</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button onClick={()=>setSelectedCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory==='all'?'bg-blue-600 text-white shadow-md':'bg-gray-100 dark:bg-slate-700 dark:text-white hover:bg-gray-200'}`}>ทั้งหมด</button>
            {categories.map(c=><button key={c.id} onClick={()=>setSelectedCategory(c.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory===c.id?'bg-blue-600 text-white shadow-md':'bg-gray-100 dark:bg-slate-700 dark:text-white hover:bg-gray-200'}`}>{c.name}</button>)}
        </div>
      </div>

      {/* News Grid */}
      {loading ? <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div> : 
       filteredNews.length === 0 ? <div className="text-center py-20 text-gray-500 bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed">ไม่พบข่าวสารในหมวดหมู่นี้</div> :
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map(n => (
             <div key={n.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl overflow-hidden flex flex-col h-full border border-gray-100 dark:border-slate-700 transition-all duration-300">
                <div className="relative h-52 bg-gray-200 dark:bg-slate-700 overflow-hidden">
                   {n.image_url ? <img src={n.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/> : <div className="flex h-full items-center justify-center text-gray-400"><ImageOff size={40}/></div>}
                   <span className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full shadow-sm">{n.category_name||'ทั่วไป'}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                   <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                       <span className="flex gap-1 items-center"><Calendar size={14}/> {new Date(n.created_at).toLocaleDateString('th-TH')}</span>
                       <span className="flex gap-1 items-center"><Eye size={14}/> {n.view_count}</span>
                   </div>
                   <h3 className="text-lg font-bold dark:text-white line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">{n.title}</h3>
                   <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">{stripHtml(n.content)}</p>
                   <button onClick={()=>handleReadNews(n.id)} className="w-full mt-auto flex justify-center items-center gap-2 bg-gray-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 py-2.5 rounded-lg transition-all font-semibold text-sm">อ่านรายละเอียด <ArrowRight size={16}/></button>
                </div>
             </div>
          ))}
       </div>
      }

      {/* 🚨 Floating Report Button (ปุ่มแจ้งปัญหาลอยมุมขวาล่าง) */}
      <button 
        onClick={handleReportIssue}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-transform hover:-translate-y-1 z-50 flex items-center gap-2 font-bold group"
        title="แจ้งปัญหาการใช้งาน"
      >
        <MessageSquareWarning size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">แจ้งปัญหา</span>
      </button>

    </div>
  );
}