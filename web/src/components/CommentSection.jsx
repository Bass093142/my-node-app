import React, { useState, useEffect } from 'react';
import { Send, Trash2, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CommentSection({ newsId, user }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [newsId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/news/${newsId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return Swal.fire('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนคอมเมนต์', 'warning');
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      // 1. 🤖 ให้ AI ตรวจสอบความรุนแรง
      const aiCheck = await fetch(`${apiUrl}/api/ai/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment })
      });
      const aiResult = await aiCheck.json();

      if (aiResult.isToxic) {
        setLoading(false);
        return Swal.fire({
          icon: 'error',
          title: 'ข้อความไม่เหมาะสม',
          text: 'AI ตรวจพบข้อความรุนแรงหรือคำหยาบคาย กรุณาใช้ถ้อยคำที่สุภาพ'
        });
      }

      // 2. ✅ ถ้าผ่าน บันทึกลงฐานข้อมูล
      const res = await fetch(`${apiUrl}/api/news/${newsId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content: newComment })
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'ไม่สามารถส่งคอมเมนต์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if ((await Swal.fire({ title: 'ลบคอมเมนต์?', icon: 'warning', showCancelButton: true })).isConfirmed) {
      await fetch(`${apiUrl}/api/news/comments/${commentId}`, { method: 'DELETE' });
      fetchComments();
    }
  };

  return (
    <div className="mt-10 p-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-100 dark:border-slate-600">
      <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
        💬 ความคิดเห็น <span className="text-sm font-normal text-gray-500">({comments.length})</span>
      </h3>
      
      {/* ช่องพิมพ์คอมเมนต์ */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input 
          type="text" 
          placeholder={user ? "แสดงความคิดเห็น..." : "กรุณาเข้าสู่ระบบเพื่อคอมเมนต์"}
          className="flex-1 p-3 rounded-lg border dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || loading}
        />
        <button 
          type="submit" 
          disabled={!user || loading || !newComment.trim()} 
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
           {loading ? <span className="animate-spin">⏳</span> : <Send size={20}/>}
        </button>
      </form>

      {/* รายการคอมเมนต์ */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">ยังไม่มีความคิดเห็น เป็นคนแรกเลยสิ!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600 animate-in fade-in">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                   {c.profile_image ? (
                     <img src={c.profile_image} className="w-10 h-10 rounded-full object-cover border"/>
                   ) : (
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{c.first_name[0]}</div>
                   )}
                   <div>
                      <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                        {c.first_name} {c.last_name} 
                        {c.role === 'admin' && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full">ADMIN</span>}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString('th-TH')}</p>
                   </div>
                 </div>
                 {/* ปุ่มลบ (เจ้าของ หรือ Admin เห็น) */}
                 {(user?.id === c.user_id || user?.role === 'admin') && (
                     <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                       <Trash2 size={16}/>
                     </button>
                 )}
              </div>
              <p className="mt-3 text-gray-700 dark:text-gray-300 ml-13 pl-13 text-sm leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}