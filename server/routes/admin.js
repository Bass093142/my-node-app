const express = require('express');
const router = express.Router();
// ⚠️ ถ้าไฟล์ db.js ของคุณอยู่ที่หน้าแรก ให้แก้เป็น: require('../db');
const db = require('../config/db'); 

// ==========================================
// 👥 1. จัดการผู้ใช้งาน (User Management)
// ==========================================

// ดึงรายชื่อ User ทั้งหมด (สำหรับตารางในหน้า Admin)
router.get('/users', async (req, res) => {
    try {
        const sql = 'SELECT id, email, first_name, last_name, role, is_banned, phone, created_at FROM users ORDER BY created_at DESC';
        const [users] = await db.query(sql);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ดึงข้อมูลผู้ใช้ไม่สำเร็จ' });
    }
});

// แบน / ปลดแบน (Toggle Ban)
router.put('/users/:id/ban', async (req, res) => {
    const { is_banned } = req.body; // รับค่า true/false จากหน้าบ้าน
    try {
        await db.query('UPDATE users SET is_banned = ? WHERE id = ?', [is_banned, req.params.id]);
        res.json({ message: is_banned ? 'ระงับการใช้งานแล้ว' : 'ปลดระงับเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ลบ User
router.delete('/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบผู้ใช้งานเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 📢 2. ระบบรายงานปัญหา (Report System)
// ==========================================

// ดูรายการแจ้งปัญหาทั้งหมด (สำหรับ Admin/Offai)
router.get('/reports', async (req, res) => {
    try {
        const sql = `
            SELECT r.*, u.first_name, u.email 
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

// แจ้งปัญหา (สำหรับ User ทั่วไป)
router.post('/reports', async (req, res) => {
    const { user_id, topic, description } = req.body;
    try {
        await db.query(
            'INSERT INTO reports (user_id, topic, description) VALUES (?, ?, ?)',
            [user_id, topic, description]
        );
        res.json({ message: 'ส่งรายงานเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// อัปเดตสถานะงาน (เช่น รับเรื่องแล้ว / แก้เสร็จแล้ว)
router.put('/reports/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'อัปเดตสถานะงานแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;