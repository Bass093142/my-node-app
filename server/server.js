require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// 1. เชื่อมต่อฐานข้อมูล (Database)
const db = require('./config/db'); 

// 2. นำเข้าแผนกต่างๆ (Routes)
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
// const aiRoutes = require('./routes/ai'); // (เปิดบรรทัดนี้ถ้ามีไฟล์ routes/ai.js)
const adminRoutes = require('./routes/admin');
const pdpaRoutes = require('./routes/pdpa');
const aiRoutes = require('./routes/ai'); // ✅ เพิ่มบรรทัดนี้

// 3. ตั้งค่า Middleware (กฎระเบียบของระบบ)
app.use(cors()); // อนุญาตให้หน้าเว็บ (Frontend) เชื่อมต่อเข้ามาได้

// ✅ สำคัญ: ปลดล็อคให้รับไฟล์รูปภาพขนาดใหญ่ได้ (50MB)
// ถ้าไม่ใส่ตรงนี้ เวลาอัปรูปจะ Error ว่า "PayloadTooLarge"
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test Route (ไว้เช็คว่า Server ไม่ตาย)
app.get('/', (req, res) => {
    res.send('✅ Backend Server is Running OK!');
});

// 4. เชื่อมโยงเส้นทาง (Routing)
app.use('/api', authRoutes);          // จัดการ Login/Register
app.use('/api/news', newsRoutes);     // จัดการข่าว
// app.use('/api/ai', aiRoutes);      // จัดการ AI
app.use('/api/admin', adminRoutes);   // จัดการหลังบ้าน Admin
app.use('/api/pdpa', pdpaRoutes);     // เก็บ Log PDPA
app.use('/api/ai', aiRoutes); // ✅ เพิ่มบรรทัดนี้
// 5. เริ่มต้น Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});