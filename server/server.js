require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // ✅ จำเป็นต้องมีบรรทัดนี้
const app = express();

// เชื่อมต่อ Database และ Routes
const db = require('./config/db'); 
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const pdpaRoutes = require('./routes/pdpa');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // รองรับรูปใหญ่
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ API Routes
app.use('/api', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdpa', pdpaRoutes);

// ========================================================
// 🔧 ส่วนแก้ปัญหา Refresh หน้าจอ (Handle React Routing)
// ========================================================

// 1. บอก Server ว่าไฟล์ React (Frontend) อยู่ที่ไหน 
// (ถ้าโฟลเดอร์ที่ Build แล้วชื่ออื่น ให้แก้คำว่า 'web/dist' เป็นชื่อนั้นครับ)
app.use(express.static(path.join(__dirname, '../web/dist')));

// 2. กฎเหล็ก: ถ้าหาไฟล์ไม่เจอ (เช่น /news/123) ให้ส่ง index.html กลับไปเสมอ
app.get('*', (req, res) => {
    // ถ้าเรียก API แล้วไม่เจอ ให้ตอบ 404 จริงๆ
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API Not Found' });
    }
    // นอกนั้นส่งหน้า React กลับไป (แก้หน้าขาว)
    res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

// ========================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});