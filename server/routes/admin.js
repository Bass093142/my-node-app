const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// ==========================================
// 👥 1. จัดการผู้ใช้งาน (User Management)
// ==========================================

// ดึงรายชื่อ User ทั้งหมด
router.get('/users', async (req, res) => {
    try {
        // ดึงข้อมูลรวมถึงรูปโปรไฟล์และเหตุผลการแบน
        const sql = `
            SELECT id, email, first_name, last_name, role, is_banned, ban_reason, profile_image, phone, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;
        const [users] = await db.query(sql);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ดึงข้อมูลผู้ใช้ไม่สำเร็จ' });
    }
});

// แบน / ปลดแบน (พร้อมบันทึกเหตุผล)
router.put('/users/:id/ban', async (req, res) => {
    const { is_banned, ban_reason } = req.body;
    try {
        // ถ้าปลดแบน ให้เคลียร์เหตุผลเป็น NULL
        const reason = is_banned ? ban_reason : null;
        
        await db.query(
            'UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?', 
            [is_banned, reason, req.params.id]
        );
        res.json({ message: is_banned ? 'ระงับการใช้งานเรียบร้อย' : 'ปลดระงับเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ลบ User ถาวร
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

// ดูรายการแจ้งปัญหาทั้งหมด (Admin View)
router.get('/reports', async (req, res) => {
    try {
        const sql = `
            SELECT r.*, u.first_name, u.email 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        const [reports] = await db.query(sql);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// แจ้งปัญหา (User View - สำหรับให้ User ทั่วไปส่งเรื่อง)
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
    const { status } = req.body; // status: 'pending', 'resolved', 'closed'
    try {
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'อัปเดตสถานะงานแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;