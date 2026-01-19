import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, Eye, ArrowLeft } from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams(); // รับ ID จาก URL
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/news/${id}`);
        if (!response.ok) throw new Error('News not found');
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error(error);
        navigate('/'); // ถ้าหาไม่เจอ ให้ดีดกลับหน้าแรก
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id, navigate, apiUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sarabun py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* รูปปกข่าว */}
        <div className="h-64 md:h-96 w-full relative">
          {news.image_url ? (
            <img 
              src={news.image_url} 
              alt={news.title} 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'; }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-400">
              ไม่มีรูปภาพ
            </div>
          )}
          {/* ปุ่มย้อนกลับ */}
          <Link to="/" className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm transition-all">
            <ArrowLeft size={20} /> กลับหน้าหลัก
          </Link>
        </div>

        {/* เนื้อหาข่าว */}
        <div className="p-8">
          {/* Badge หมวดหมู่ */}
          <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
            {news.category_name || 'ข่าวทั่วไป'}
          </span>

          <h1 className="text-3xl md:text-4xl font-bold mt-4 text-gray-900 dark:text-white leading-tight">
            {news.title}
          </h1>

          {/* Meta Data (วันที่, ผู้เขียน, ยอดวิว) */}
          <div className="flex flex-wrap items-center gap-6 mt-4 text-gray-500 dark:text-gray-400 text-sm border-b dark:border-slate-700 pb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {new Date(news.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <User size={16} />
              {news.author_name || 'Admin'}
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} />
              {news.view_count || 0} ครั้ง
            </div>
          </div>

          {/* เนื้อหา Text (รองรับการขึ้นบรรทัดใหม่) */}
          <div className="mt-8 text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {news.content}
          </div>

        </div>
      </div>
    </div>
  );
}