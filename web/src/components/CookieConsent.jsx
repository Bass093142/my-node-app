import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = async () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);

    // เก็บ Log ลง Database
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      // ดึง IP แบบง่าย (ผ่าน API ฟรี)
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();

      await fetch(`${apiUrl}/api/pdpa/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user ? user.id : null,
          ip_address: ipData.ip,
          user_agent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('PDPA Log Error:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600 dark:bg-slate-700 dark:text-blue-400">
            <Cookie size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-white">เว็บไซต์นี้ใช้คุกกี้ (Cookies)</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุดให้กับท่าน และเก็บข้อมูลการใช้งานเพื่อพัฒนาระบบ ตามนโยบาย PDPA
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
