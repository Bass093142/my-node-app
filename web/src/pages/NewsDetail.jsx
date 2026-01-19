import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, Eye, ArrowLeft } from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [news, setNews] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/news/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setNews)
      .catch(() => navigate('/'));
  }, [id, navigate, apiUrl]);

  if (!news) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sarabun py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Cover Image */}
        <div className="h-64 md:h-96 w-full relative bg-gray-200">
           {news.image_url && <img src={news.image_url} className="w-full h-full object-cover"/>}
           <Link to="/" className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-full flex gap-2 backdrop-blur-sm hover:bg-black/70"><ArrowLeft size={20}/> กลับหน้าหลัก</Link>
        </div>

        <div className="p-8">
          <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">{news.category_name || 'ทั่วไป'}</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 dark:text-white leading-tight">{news.title}</h1>
          
          <div className="flex gap-6 mt-4 text-gray-500 dark:text-gray-400 text-sm border-b pb-4 dark:border-slate-700">
            <span className="flex gap-2"><Calendar size={16}/> {new Date(news.created_at).toLocaleDateString('th-TH')}</span>
            <span className="flex gap-2"><User size={16}/> {news.author_name}</span>
            <span className="flex gap-2"><Eye size={16}/> {news.view_count}</span>
          </div>

          {/* ✅ ส่วนแสดงผล HTML จาก TinyMCE */}
          <div 
            className="mt-8 prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: news.content }} 
          />
        </div>
      </div>
    </div>
  );
}