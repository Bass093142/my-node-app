import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Eye, ArrowRight, ImageOff } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข่าวเมื่อเข้าเว็บ
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/news`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        setNewsList(data);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [apiUrl]);

  // ฟังก์ชันกดอ่านข่าว (นับวิว + เปลี่ยนหน้า)
  const handleReadNews = async (id) => {
    try {
      // ยิง API นับวิว (แบบ Fire & Forget ไม่ต้องรอ)
      fetch(`${apiUrl}/api/news/${id}/view`, { method: 'POST' });
      // เปลี่ยนหน้าทันที
      navigate(`/news/${id}`);
    } catch (error) {
      navigate(`/news/${id}`);
    }
  };

  return (
    <div className="font-sarabun space-y-10 pb-10">
      
      {/* 1. Hero Banner (ส่วนหัว) */}
      <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 md:p-12 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            ติดตามข่าวสาร<br/>กิจกรรมวิทยาลัย
          </h1>
          <p className="text-blue-100 text-lg mb-6">
            อัปเดตข้อมูลข่าวสาร ประกาศ และกิจกรรมล่าสุดจากวิทยาลัยอาชีวศึกษานครสวรรค์
          </p>
          <button onClick={() => document.getElementById('news-section').scrollIntoView({ behavior: 'smooth' })} className="bg-white text-blue-700 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-transform transform hover:scale-105">
            อ่านข่าวล่าสุด
          </button>
        </div>
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* 2. News Grid Section */}
      <div id="news-section">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white border-l-4 border-blue-600 pl-3">
            ข่าวประชาสัมพันธ์ล่าสุด
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : newsList.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">ยังไม่มีข่าวสารในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsList.map((news) => (
              <div 
                key={news.id} 
                className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300 flex flex-col h-full"
              >
                {/* รูปปกข่าว */}
                <div className="relative h-52 overflow-hidden bg-gray-200">
                  {news.image_url ? (
                    <img 
                      src={news.image_url} 
                      alt={news.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  {/* Fallback Image (ถ้าโหลดรูปไม่ได้ หรือไม่มีรูป) */}
                  <div className="hidden w-full h-full absolute inset-0 bg-gray-100 dark:bg-slate-700 items-center justify-center text-gray-400" style={{ display: news.image_url ? 'none' : 'flex' }}>
                    <ImageOff size={40} />
                  </div>
                  
                  {/* Badge หมวดหมู่ */}
                  <span className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {news.category_name || 'ทั่วไป'}
                  </span>
                </div>

                {/* เนื้อหา */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Meta Data */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(news.created_at).toLocaleDateString('th-TH')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      {news.view_count || 0}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {news.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">
                    {news.content}
                  </p>

                  <button 
                    onClick={() => handleReadNews(news.id)}
                    className="w-full mt-auto flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 font-semibold py-2 rounded-lg transition-all"
                  >
                    อ่านรายละเอียด <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}