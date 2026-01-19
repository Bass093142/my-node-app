require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// 1. นำเข้า Database Config
const db = require('./config/db'); 

// 2. นำเข้า Routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai'); // (ถ้าไม่ได้ใช้ AI ตัดบรรทัดนี้ได้)
const adminRoutes = require('./routes/admin');
const pdpaRoutes = require('./routes/pdpa'); // ✅ Route ใหม่สำหรับ Cookie Log

app.use(cors());

// ✅ เพิ่ม Limit รองรับการอัปโหลดรูปภาพขนาดใหญ่ (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test Route
app.get('/', (req, res) => {
    res.send(`
        <div style="text-align: center; padding-top: 50px; font-family: sans-serif;">
            <h1 style="color: #2da44e;">✅ Backend Server is Running!</h1>
            <p>Services: Auth, News, Admin, PDPA</p>
        </div>
    `);
});

// 3. เรียกใช้งาน Routes
app.use('/api', authRoutes);          // Login, Register, Profile
app.use('/api/news', newsRoutes);     // News, Categories, Views
app.use('/api/ai', aiRoutes);         // AI Summary
app.use('/api/admin', adminRoutes);   // Admin Dashboard (User, Reports)
app.use('/api/pdpa', pdpaRoutes);     // Cookie Consent Log

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});