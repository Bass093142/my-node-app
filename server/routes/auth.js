const express = require('express');        // 1. เรียกใช้ Express
const router = express.Router();           // 2. ✅ สร้างตัวแปร router ตรงนี้ (ที่ Error เพราะบรรทัดนี้หาย)
const db = require('../config/db');        // 3. เรียกใช้ Database

// ==========================================
// 🔐 ส่วนจัดการสมาชิก (Auth)
// ==========================================

// 1. สมัครสมาชิก (Register)
router.post('/register', async (req, res) => {
    const { email, password, prefix, first_name, last_name, phone, gender } = req.body;
    try {
        // เช็คอีเมลซ้ำ
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // เพิ่มลงฐานข้อมูล
        await db.query(
            'INSERT INTO users (email, password, prefix, first_name, last_name, phone, gender, role) VALUES (?, ?, ?, ?, ?, ?, ?, "user")', 
            [email, password, prefix, first_name, last_name, phone, gender]
        );
        res.json({ status: 'ok', message: 'สมัครสมาชิกสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. เข้าสู่ระบบ (Login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (users.length > 0) {
            const user = users[0];
            // เช็คสถานะแบน
            if (user.is_banned) {
                return res.status(403).json({ message: 'บัญชีของคุณถูกระงับการใช้งาน' });
            }
            res.json({ 
                status: 'ok', 
                message: 'Login successful',
                user: user 
            });
        } else {
            res.status(401).json({ status: 'error', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;