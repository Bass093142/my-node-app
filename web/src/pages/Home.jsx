import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, ArrowRight, ImageOff } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch(`${apiUrl}/api/news`), fetch(`${apiUrl}/api/news/categories/all`)])
      .then(async ([resN, resC]) => { setNewsList(await resN.json()); setCategories(await resC.json()); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  const handleReadNews = (id) => {
    fetch(`${apiUrl}/api/news/${id}/view`, {method:'POST'});
    navigate(`/news/${id}`);
  };

  // ✅ ฟังก์ชันล้าง HTML Tags ออกจากเนื้อหาตัวอย่าง
  const stripHtml = (html) => {
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  const filteredNews = selectedCategory === 'all' ? newsList : newsList.filter(n => n.category_id === parseInt(selectedCategory));

  return (
    <div className="font-sarabun space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4 dark:border-slate-700">
        <h2 className="text-2xl font-bold dark:text-white border-l-4 border-blue-600 pl-3">ข่าวประชาสัมพันธ์</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={()=>setSelectedCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${selectedCategory==='all'?'bg-blue-600 text-white':'bg-gray-100 dark:bg-slate-700 dark:text-white'}`}>ทั้งหมด</button>
            {categories.map(c=><button key={c.id} onClick={()=>setSelectedCategory(c.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${selectedCategory===c.id?'bg-blue-600 text-white':'bg-gray-100 dark:bg-slate-700 dark:text-white'}`}>{c.name}</button>)}
        </div>
      </div>

      {loading ? <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div> : 
       filteredNews.length === 0 ? <div className="text-center py-20 text-gray-500">ไม่พบข่าวสาร</div> :
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map(n => (
             <div key={n.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-xl overflow-hidden flex flex-col h-full border dark:border-slate-700 transition-all">
                <div className="relative h-52 bg-gray-200 dark:bg-slate-700 overflow-hidden">
                   {n.image_url ? <img src={n.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/> : <div className="flex h-full items-center justify-center text-gray-400"><ImageOff size={40}/></div>}
                   <span className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs px-3 py-1 rounded-full">{n.category_name||'ทั่วไป'}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                   <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3"><span className="flex gap-1"><Calendar size={14}/> {new Date(n.created_at).toLocaleDateString('th-TH')}</span><span className="flex gap-1"><Eye size={14}/> {n.view_count}</span></div>
                   <h3 className="text-lg font-bold dark:text-white line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">{n.title}</h3>
                   {/* ✅ ใช้ stripHtml เพื่อโชว์ตัวอย่างเนื้อหาแบบไม่มี Tag */}
                   <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">{stripHtml(n.content)}</p>
                   <button onClick={()=>handleReadNews(n.id)} className="w-full mt-auto flex justify-center gap-2 bg-gray-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 py-2 rounded-lg transition-all font-semibold">อ่านรายละเอียด <ArrowRight size={16}/></button>
                </div>
             </div>
          ))}
       </div>
      }
    </div>
  );
}