import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, ArrowRight, ImageOff } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ State สำหรับการคัดกรองข่าว
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resNews, resCats] = await Promise.all([
          fetch(`${apiUrl}/api/news`),
          fetch(`${apiUrl}/api/news/categories/all`)
        ]);
        setNewsList(await resNews.json());
        setCategories(await resCats.json());
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchAll();
  }, [apiUrl]);

  const handleReadNews = async (id) => {
    try { fetch(`${apiUrl}/api/news/${id}/view`, { method: 'POST' }); navigate(`/news/${id}`); } 
    catch { navigate(`/news/${id}`); }
  };

  // ✅ กรองข่าวตามหมวดหมู่ที่เลือก
  const filteredNews = selectedCategory === 'all' 
    ? newsList 
    : newsList.filter(news => news.category_id === parseInt(selectedCategory));

  return (
    <div className="font-sarabun space-y-6 pb-10">
      
      {/* ❌ เอา Hero Banner ออกไปแล้วตามคำขอ */}

      {/* ✅ ส่วนหัว + ตัวคัดกรองหมวดหมู่ (Filter) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white border-l-4 border-blue-600 pl-3">
          ข่าวประชาสัมพันธ์
        </h2>
        
        {/* ปุ่มหมวดหมู่ (Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
          <p className="text-gray-500 dark:text-gray-400">ไม่พบข่าวในหมวดหมู่นี้</p>
        </div>
      ) : (
        /* News Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((news) => (
            <div key={news.id} className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300 flex flex-col h-full">
              {/* Cover Image */}
              <div className="relative h-52 overflow-hidden bg-gray-200 dark:bg-slate-700">
                {news.image_url ? (
                  <img src={news.image_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div className="hidden w-full h-full absolute inset-0 items-center justify-center text-gray-400" style={{ display: news.image_url ? 'none' : 'flex' }}>
                  <ImageOff size={40} />
                </div>
                <span className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {news.category_name || 'ทั่วไป'}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(news.created_at).toLocaleDateString('th-TH')}</div>
                  <div className="flex items-center gap-1"><Eye size={14} /> {news.view_count || 0}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{news.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">{news.content}</p>
                <button onClick={() => handleReadNews(news.id)} className="w-full mt-auto flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 font-semibold py-2 rounded-lg transition-all">
                  อ่านรายละเอียด <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}