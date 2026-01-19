require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// 1. เชื่อมต่อฐานข้อมูล (เรียกใช้ไฟล์ db.js ในโฟลเดอร์ config)
// ⚠️ ถ้าไฟล์ db.js ของคุณอยู่ที่หน้าแรก ให้แก้เป็น: require('./db');
const db = require('./config/db'); 

// 2. นำเข้า Routes (ไฟล์ที่แยกไว้ในโฟลเดอร์ routes)
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin'); // ✅ ส่วนที่เพิ่มมา

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test Route (เช็คว่า Server ทำงานไหม)
app.get('/', (req, res) => {
    res.send(`
        <div style="text-align: center; padding-top: 50px; font-family: sans-serif;">
            <h1 style="color: #2da44e;">✅ Backend Server is Running!</h1>
            <p>Services: Auth, News, AI, Admin</p>
        </div>
    `);
});

// 3. ใช้งาน Routes
app.use('/api', authRoutes);          // สำหรับ Login/Register
app.use('/api/news', newsRoutes);     // สำหรับ ข่าว
app.use('/api/ai', aiRoutes);         // สำหรับ AI
app.use('/api/admin', adminRoutes);   // ✅ สำหรับ Admin Dashboard

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});