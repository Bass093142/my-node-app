const express = require('express');
const router = express.Router();
const db = require('../config/db'); // เชื่อมต่อ DB

// ==========================================
// 👥 ส่วนจัดการผู้ใช้งาน (User Management)
// ==========================================

// 1. ดึงรายชื่อ User ทั้งหมด (สำหรับหน้า Admin Dashboard)
router.get('/users', async (req, res) => {
    try {
        // เลือกมาเฉพาะข้อมูลที่จำเป็น (ไม่เอา password)
        const sql = 'SELECT id, email, first_name, last_name, role, is_banned, phone, created_at FROM users ORDER BY created_at DESC';
        const [users] = await db.query(sql);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. แบน หรือ ปลดแบน User (Toggle Ban)
router.put('/users/:id/ban', async (req, res) => {
    const { is_banned } = req.body; // รับค่า true (แบน) หรือ false (ปลด)
    try {
        await db.query('UPDATE users SET is_banned = ? WHERE id = ?', [is_banned, req.params.id]);
        
        const statusText = is_banned ? 'ระงับการใช้งาน' : 'ปลดระงับ';
        res.json({ message: `ทำการ${statusText}ผู้ใช้เรียบร้อยแล้ว` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ลบ User ถาวร
router.delete('/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบผู้ใช้งานออกจากระบบแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 📢 ส่วนจัดการรายงานปัญหา (Report System)
// ==========================================

// 4. (User) แจ้งปัญหาเข้ามา
router.post('/reports', async (req, res) => {
    const { user_id, topic, description } = req.body;
    
    if (!user_id || !topic) {
        return res.status(400).json({ message: 'กรุณากรอกหัวข้อปัญหา' });
    }

    try {
        const sql = 'INSERT INTO reports (user_id, topic, description) VALUES (?, ?, ?)';
        await db.query(sql, [user_id, topic, description]);
        res.json({ status: 'ok', message: 'ส่งรายงานปัญหาเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. (Admin/Offai) ดูรายการแจ้งปัญหาทั้งหมด
router.get('/reports', async (req, res) => {
    try {
        // Join ตาราง users เพื่อให้รู้ว่าใครแจ้งมา
        const sql = `
            SELECT r.*, u.first_name, u.last_name, u.email 
            FROM reports r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        const [reports] = await db.query(sql);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. (Admin/Offai) อัปเดตสถานะงาน (เช่น รับเรื่องแล้ว / แก้ไขเสร็จแล้ว)
router.put('/reports/:id/status', async (req, res) => {
    const { status } = req.body; // ค่าที่ส่งมา: 'pending', 'resolved', 'closed'
    try {
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'อัปเดตสถานะงานเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;