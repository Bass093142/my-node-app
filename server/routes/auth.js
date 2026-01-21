const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 📝 1. สมัครสมาชิก (Register)
// ==========================================
router.post('/register', async (req, res) => {
    const { email, password, first_name, last_name, prefix, pet_name } = req.body;
    
    if (!email || !password || !first_name || !pet_name) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน (โดยเฉพาะชื่อสัตว์เลี้ยง)' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        await db.query(
            'INSERT INTO users (email, password, first_name, last_name, prefix, pet_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, password, first_name, last_name, prefix, pet_name, 'user']
        );
        res.json({ message: 'สมัครสมาชิกสำเร็จ' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🔑 2. เข้าสู่ระบบ (Login)
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) return res.status(404).json({ message: 'ไม่พบอีเมลนี้' });

        if (user.is_banned) {
            return res.status(403).json({ 
                message: `บัญชีถูกระงับ: ${user.ban_reason || 'ละเมิดกฎการใช้งาน'}` 
            });
        }

        if (password !== user.password) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

        const token = 'mock-jwt-token-' + user.id;
        const { password: _, ...userData } = user;
        
        res.json({ message: 'เข้าสู่ระบบสำเร็จ', token, user: userData });

    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 👤 3. แก้ไขข้อมูลส่วนตัว + อัปโหลดรูป (Update Profile) ✅ เพิ่มใหม่
// ==========================================
router.put('/profile', async (req, res) => {
    const { id, first_name, last_name, password, profile_image } = req.body;

    try {
        // 1. เตรียม SQL พื้นฐาน (แก้ชื่อ, นามสกุล, รูปภาพ)
        let sql = 'UPDATE users SET first_name = ?, last_name = ?, profile_image = ?';
        let params = [first_name, last_name, profile_image];

        // 2. ถ้ามีการส่งรหัสผ่านใหม่มา ให้เพิ่มเข้าไปใน SQL
        if (password && password.trim() !== '') {
            sql += ', password = ?';
            params.push(password);
        }

        // 3. ระบุว่าแก้ ID ไหน
        sql += ' WHERE id = ?';
        params.push(id);

        // 4. บันทึกลงฐานข้อมูล
        await db.query(sql, params);

        // 5. ดึงข้อมูลล่าสุดส่งกลับไปหน้าบ้าน (เพื่อให้ LocalStorage อัปเดตทันที)
        const [updatedUser] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        const { password: _, ...userData } = updatedUser[0]; // ตัด password ออกก่อนส่งกลับ

        res.json({ message: 'บันทึกข้อมูลเรียบร้อย', user: userData });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

// ==========================================
// 🔄 4. กู้คืนรหัสผ่าน (Reset Password)
// ==========================================
router.post('/reset-password', async (req, res) => {
    const { email, pet_name, new_password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND pet_name = ?', [email, pet_name]);
        if (users.length === 0) return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });

        await db.query('UPDATE users SET password = ? WHERE id = ?', [new_password, users[0].id]);
        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;