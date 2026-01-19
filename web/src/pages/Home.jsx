import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Home() {
  // ✅ ใช้ตัวแปรกลาง (ถ้าไม่มีให้ใช้ localhost)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลข่าวเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/news`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNewsList(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเพิ่มยอดวิว (เมื่อกดอ่าน)
  const handleReadNews = async (id) => {
    try {
      await fetch(`${apiUrl}/api/news/${id}/view`, { method: 'POST' });
      // (ในอนาคตอาจจะ Navigate ไปหน้าอ่านข่าวละเอียดตรงนี้)
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="font-sarabun pb-10">
      {/* Header ส่วนหัว */}
      <div className="mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 p-10 rounded-2xl shadow-lg text-white">
        <h1 className="text-4xl font-bold mb-2">📰 ข่าวประชาสัมพันธ์</h1>
        <p className="text-blue-100">อัปเดตข่าวสารล่าสุดจากวิทยาลัยและกิจกรรมที่น่าสนใจ</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข่าวสาร...</p>
        </div>
      ) : (
        <>
          {/* กรณีไม่มีข่าว */}
          {newsList.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow border border-dashed border-gray-300 dark:border-slate-600">
              <p className="text-xl text-gray-500 dark:text-gray-400">ยังไม่มีข่าวสารในขณะนี้</p>
            </div>
          ) : (
            /* Grid แสดงรายการข่าว */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsList.map((news) => (
                <div 
                  key={news.id} 
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col h-full"
                >
                  {/* รูปปกข่าว */}
                  <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-slate-700 group">
                    {news.image_url ? (
                      <img 
                        src={news.image_url} 
                        alt={news.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }} // กันภาพแตก
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span>ไม่มีรูปภาพ</span>
                      </div>
                    )}
                    {/* Badge หมวดหมู่ */}
                    <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {news.category_name || 'ทั่วไป'}
                    </span>
                  </div>

                  {/* เนื้อหาข่าว */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-2 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                      <span>📅 {new Date(news.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      <span>•</span>
                      <span>👁️ {news.view_count || 0} วิว</span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white line-clamp-2 hover:text-blue-600 transition-colors">
                      {news.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">
                      {news.content}
                    </p>

                    <div className="mt-auto border-t dark:border-slate-700 pt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        เขียนโดย: {news.author_name || 'Admin'}
                      </span>
                      <button 
                        onClick={() => handleReadNews(news.id)}
                        className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline"
                      >
                        อ่านต่อ →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}