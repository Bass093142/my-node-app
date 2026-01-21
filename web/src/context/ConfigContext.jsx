import React, { createContext, useState, useContext, useEffect } from 'react';

const ConfigContext = createContext();

// 📖 พจนานุกรมคำศัพท์ (แปลภาษาตรงนี้)
const translations = {
  th: {
    home: "หน้าแรก",
    news: "ข่าวประชาสัมพันธ์",
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
    report: "แจ้งปัญหา",
    reportTopic: "หัวข้อปัญหา",
    reportDesc: "รายละเอียด",
    readMore: "อ่านรายละเอียด",
    views: "ยอดวิว",
    welcome: "ยินดีต้อนรับ",
    adminPanel: "ระบบหลังบ้าน",
    all: "ทั้งหมด",
    search: "ค้นหา...",
    category: "หมวดหมู่",
    status: "สถานะ",
    myReports: "ประวัติการแจ้งปัญหา",
    adminReply: "ตอบกลับจากแอดมิน",
    pending: "รอตรวจสอบ",
    resolved: "แก้ไขแล้ว",
    closed: "ปิดงาน",
    submit: "ส่งข้อมูล",
    cancel: "ยกเลิก",
    sentSuccess: "ส่งข้อมูลเรียบร้อย",
    loginFirst: "กรุณาเข้าสู่ระบบก่อน",
    newsNotFound: "ไม่พบข่าว",
    aiSummary: "สรุปโดย AI",
    aiReading: "AI กำลังอ่านข่าว...",
    aiSummarizeBtn: "ให้ AI สรุปเนื้อหาข่าวนี้",
    backHome: "กลับหน้าหลัก",
    reportContent: "แจ้งเนื้อหาไม่เหมาะสม",
    reportThanks: "ขอบคุณ เราได้รับรายงานของคุณแล้ว"
  },
  en: {
    home: "Home",
    news: "News & Events",
    login: "Login",
    logout: "Logout",
    report: "Report Issue",
    reportTopic: "Topic",
    reportDesc: "Description",
    readMore: "Read More",
    views: "Views",
    welcome: "Welcome",
    adminPanel: "Admin Panel",
    all: "All",
    search: "Search...",
    category: "Category",
    status: "Status",
    myReports: "My Reports",
    adminReply: "Admin Reply",
    pending: "Pending",
    resolved: "Resolved",
    closed: "Closed",
    submit: "Submit",
    cancel: "Cancel",
    sentSuccess: "Sent Successfully",
    loginFirst: "Please Login First",
    newsNotFound: "News Not Found",
    aiSummary: "AI Summary",
    aiReading: "AI is reading...",
    aiSummarizeBtn: "Summarize with AI",
    backHome: "Back to Home",
    reportContent: "Report Content",
    reportThanks: "Thanks, report received"
  }
};

export const ConfigProvider = ({ children }) => {
  // ดึงค่าเดิมจากเครื่อง ถ้าไม่มีให้ใช้ค่าเริ่มต้น
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'th');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // เปลี่ยนธีมจริง (ใส่ class 'dark' ให้ html)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // บันทึกภาษาลงเครื่อง
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = (key) => translations[lang][key] || key;
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'th' ? 'en' : 'th');

  return (
    <ConfigContext.Provider value={{ lang, theme, t, toggleTheme, toggleLang }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);