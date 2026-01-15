import { useEffect, useState } from 'react';
import axios from 'axios';

// ⚠️ ใส่ลิ้งค์ Render ของคุณที่ได้มา (ไม่มี / ต่อท้าย)
const API_URL = 'https://my-node-app-fce8.onrender.com/'; 

function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/news`)
      .then(res => {
        setNews(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">
        อัปเดตข่าวสารล่าสุด
      </h1>
      
      {loading ? (
        <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-white rounded-lg shadow">
              <p className="text-gray-500">ยังไม่มีข่าวในระบบ</p>
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                    ไม่มีรูปภาพ
                  </div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {item.category_name || 'ทั่วไป'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-800 line-clamp-2">{item.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{item.content}</p>
                  <div className="border-t pt-3 flex justify-between items-center text-sm text-gray-500">
                    <span>เขียนโดย: {item.author_name || 'Admin'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;