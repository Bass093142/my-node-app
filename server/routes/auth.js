const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 📝 1. สมัครสมาชิก (Register)
// ==========================================
router.post('/register', async (req, res) => {
    const { email, password, first_name, last_name, prefix, pet_name } = req.body;
    
    // เช็คข้อมูลครบไหม
    if (!email || !password || !first_name || !pet_name) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน (โดยเฉพาะชื่อสัตว์เลี้ยง)' });
    }

    try {
        // เช็คอีเมลซ้ำ
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // บันทึกข้อมูล (role default = 'user')
        await db.query(
            'INSERT INTO users (email, password, first_name, last_name, prefix, pet_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, password, first_name, last_name, prefix, pet_name, 'user']
        );
        
        res.json({ message: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
});

// ==========================================
// 🔑 2. เข้าสู่ระบบ (Login) + เช็คแบน
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        // 1. ไม่พบผู้ใช้
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });
        }

        // 🛑 2. เช็คว่าโดนแบนไหม (สำคัญ!)
        if (user.is_banned) {
            return res.status(403).json({ 
                message: `บัญชีของคุณถูกระงับการใช้งาน!`,
                reason: user.ban_reason || 'ละเมิดกฎการใช้งานชุมชน'
            });
        }

        // 3. เช็ครหัสผ่าน
        if (password !== user.password) {
            return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // สร้าง Token แบบง่าย (ใช้ User ID ต่อท้าย)
        const token = 'mock-jwt-token-' + user.id;
        
        // ส่งข้อมูลกลับ (ตัด password ออกเพื่อความปลอดภัย)
        const { password: _, ...userData } = user;
        
        res.json({ 
            message: 'เข้าสู่ระบบสำเร็จ', 
            token, 
            user: userData 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// ==========================================
// 🔄 3. กู้คืนรหัสผ่าน (Reset Password)
// ==========================================
router.post('/reset-password', async (req, res) => {
    const { email, pet_name, new_password } = req.body;
    
    if (!email || !pet_name || !new_password) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        // เช็คว่า Email และ ชื่อสัตว์เลี้ยง ตรงกันไหม
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND pet_name = ?', [email, pet_name]);
        
        if (users.length === 0) {
            return res.status(400).json({ message: 'ข้อมูลยืนยันตัวตนไม่ถูกต้อง (ชื่อสัตว์เลี้ยงผิด)' });
        }

        // อัปเดตรหัสผ่านใหม่
        await db.query('UPDATE users SET password = ? WHERE id = ?', [new_password, users[0].id]);
        
        res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว! กรุณาเข้าสู่ระบบใหม่' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
    }
});

module.exports = router;