import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, Eye, ArrowLeft, Sparkles, Flag } from 'lucide-react';
import Swal from 'sweetalert2';
import CommentSection from '../components/CommentSection';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/news/${id}`);
        if (!res.ok) throw new Error('News not found');
        const data = await res.json();
        setNews(data);
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id, navigate, apiUrl]);

  // ✨ ฟังก์ชัน AI สรุปข่าว
  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
        const res = await fetch(`${apiUrl}/api/ai/summarize`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ content: news.content }) // ส่งเนื้อหาไปให้ AI
        });
        const data = await res.json();
        setSummary(data.summary);
    } catch (e) {
        console.error(e);
        Swal.fire('AI Error', 'ไม่สามารถสรุปข่าวได้ในขณะนี้', 'error');
    } finally {
        setIsSummarizing(false);
    }
  };

  // 🚩 ฟังก์ชันแจ้งปัญหา (Report)
  const handleReport = async () => {
    if (!user) return Swal.fire('กรุณาเข้าสู่ระบบ', 'คุณต้องล็อกอินก่อนแจ้งปัญหา', 'warning');
    
    const { value: reason } = await Swal.fire({
      title: 'แจ้งเนื้อหาไม่เหมาะสม',
      input: 'textarea',
      inputLabel: 'โปรดระบุรายละเอียด',
      inputPlaceholder: 'เช่น ข่าวปลอม, เนื้อหารุนแรง...',
      showCancelButton: true,
      confirmButtonText: 'ส่งรายงาน',
      confirmButtonColor: '#ef4444'
    });

    if (reason) {
      try {
        await fetch(`${apiUrl}/api/admin/reports`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ user_id: user.id, topic: `รายงานข่าว: ${news.title}`, description: reason })
        });
        Swal.fire('ขอบคุณ', 'เราได้รับรายงานของคุณแล้ว', 'success');
      } catch (e) {
        Swal.fire('Error', 'ส่งรายงานไม่สำเร็จ', 'error');
      }
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!news) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sarabun py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Cover Image */}
        <div className="h-64 md:h-96 w-full relative bg-gray-200 dark:bg-slate-700">
           {news.image_url && <img src={news.image_url} className="w-full h-full object-cover"/>}
           <Link to="/" className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-full flex gap-2 backdrop-blur-sm hover:bg-black/80 transition-all shadow-lg">
             <ArrowLeft size={20}/> กลับหน้าหลัก
           </Link>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex justify-between items-start">
             <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
               {news.category_name || 'ทั่วไป'}
             </span>
             {/* ปุ่มแจ้งปัญหา */}
             <button onClick={handleReport} className="text-gray-400 hover:text-red-500 transition-colors" title="แจ้งเนื้อหาไม่เหมาะสม">
                <Flag size={20}/>
             </button>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mt-4 dark:text-white leading-tight">{news.title}</h1>
          
          <div className="flex flex-wrap gap-6 mt-4 text-gray-500 dark:text-gray-400 text-sm border-b pb-6 dark:border-slate-700">
            <span className="flex gap-2 items-center"><Calendar size={16}/> {new Date(news.created_at).toLocaleDateString('th-TH')}</span>
            <span className="flex gap-2 items-center"><User size={16}/> {news.author_name}</span>
            <span className="flex gap-2 items-center"><Eye size={16}/> {news.view_count} ครั้ง</span>
          </div>

          {/* AI Summary Section */}
          <div className="mt-6 mb-8">
             {!summary ? (
                <button 
                  onClick={handleSummarize} 
                  disabled={isSummarizing}
                  className="bg-purple-100 text-purple-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-200 transition-colors w-full md:w-auto justify-center"
                >
                  <Sparkles size={20} className={isSummarizing ? "animate-spin" : ""}/> 
                  {isSummarizing ? 'AI กำลังอ่านข่าว...' : 'ให้ AI สรุปเนื้อหาข่าวนี้'}
                </button>
             ) : (
                <div className="bg-purple-50 dark:bg-purple-900/30 p-5 rounded-xl border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-top-2">
                    <h4 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2">
                      <Sparkles size={18}/> สรุปโดย AI
                    </h4>
                    <p className="text-purple-900 dark:text-purple-100 leading-relaxed">{summary}</p>
                </div>
             )}
          </div>

          {/* เนื้อหาข่าว (HTML) */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert prose-img:rounded-xl prose-a:text-blue-600"
            dangerouslySetInnerHTML={{ __html: news.content }} 
          />

          {/* Comment Section */}
          <div className="border-t mt-12 pt-6 dark:border-slate-700">
             <CommentSection newsId={id} user={user} />
          </div>

        </div>
      </div>
    </div>
  );
}