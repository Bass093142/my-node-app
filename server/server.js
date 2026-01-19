require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// 1. นำเข้า Database Config (เพื่อให้ Server เริ่มทำงาน Connection Pool รอไว้)
const db = require('./config/db'); 

// 2. นำเข้า Routes (ไฟล์ที่แยกไว้ในโฟลเดอร์ routes)
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin'); // ✅ เพิ่ม Route แอดมิน

app.use(cors());
app.use(express.json());

// Test Route (หน้าแรก)
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #2da44e;">✅ Backend Server is Running!</h1>
            <p>Ready with Modules: Auth, News, AI, Admin</p>
        </div>
    `);
});

// 3. เรียกใช้งาน Routes (Map URL ให้ตรงกับไฟล์)
app.use('/api', authRoutes);          // ->Login/Register/Reset Pass
app.use('/api/news', newsRoutes);     // -> ข่าว, คอมเมนต์, ยอดวิว
app.use('/api/ai', aiRoutes);         // -> AI สรุปข่าว
app.use('/api/admin', adminRoutes);   // -> ✅ จัดการ User, Report

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});