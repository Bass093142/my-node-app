const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 📊 1. Dashboard Stats (สถิติภาพรวม)
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        const [news] = await db.query('SELECT COUNT(*) as count FROM news');
        const [reports] = await db.query('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');
        
        res.json({ 
            users: users[0].count, 
            news: news[0].count, 
            reports: reports[0].count 
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ==========================================
// 👥 2. User Management (จัดการผู้ใช้งาน)
// ==========================================

// 2.1 ดึงรายชื่อผู้ใช้ทั้งหมด
router.get('/users', async (req, res) => {
    try { 
        // เรียงลำดับจากใหม่ไปเก่า
        const [rows] = await db.query('SELECT id, first_name, last_name, email, role, profile_image, is_banned, ban_reason, created_at FROM users ORDER BY created_at DESC'); 
        res.json(rows); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2.2 เปลี่ยนสิทธิ์ผู้ใช้งาน (Change Role)
router.put('/users/:id/role', async (req, res) => {
    const { role } = req.body; 
    
    if (!['user', 'officer', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'ค่า Role ไม่ถูกต้อง' });
    }

    try { 
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]); 
        res.json({ message: `อัปเดตสิทธิ์เป็น ${role} เรียบร้อยแล้ว` }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2.3 สั่งแบน / ปลดแบน (Ban/Unban)
router.put('/users/:id/ban', async (req, res) => {
    const { is_banned, ban_reason } = req.body;
    try { 
        await db.query(
            'UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?', 
            [is_banned, ban_reason, req.params.id]
        ); 
        res.json({ message: 'อัปเดตสถานะการแบนเรียบร้อย' }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 2.4 🗑️ ลบ User ถาวร (ใช้ความสามารถของ SQL จัดการข้อมูลที่ผูกมัด) ✅
router.delete('/users/:id', async (req, res) => {
    try { 
        // สั่งลบได้เลย! Database จะเปลี่ยน user_id ในตารางอื่นให้เป็น NULL เอง (ตามที่คุณตั้งค่าใน SQL)
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]); 
        
        res.json({ message: 'ลบผู้ใช้เรียบร้อย (โพสต์และประวัติยังถูกเก็บไว้)' }); 
    } catch (err) { 
        console.error("Delete Error:", err);
        res.status(500).json({ error: 'ลบไม่ได้: ' + err.message }); 
    }
});

// ==========================================
// ⚠️ 3. Report Management (จัดการแจ้งปัญหา)
// ==========================================

// 3.1 ดึงรายการแจ้งปัญหาทั้งหมด (สำหรับ Admin)
router.get('/reports', async (req, res) => {
    try {
        const sql = `
            SELECT r.*, u.first_name, u.email 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 3.2 เพิ่มรายงานปัญหา (User ส่งมา)
router.post('/reports', async (req, res) => {
    const { user_id, topic, description } = req.body;
    try {
        await db.query(
            'INSERT INTO reports (user_id, topic, description) VALUES (?, ?, ?)', 
            [user_id, topic, description]
        );
        res.json({ message: 'ส่งเรื่องแจ้งปัญหาเรียบร้อย' });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 3.3 อัปเดตสถานะ (เช่น pending -> closed)
router.put('/reports/:id/status', async (req, res) => {
    const { status } = req.body;
    try { 
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]); 
        res.json({ message: 'อัปเดตสถานะงานแล้ว' }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// 3.4 ตอบกลับ User (Reply System)
router.put('/reports/:id/reply', async (req, res) => {
    const { reply } = req.body;
    try {
        await db.query(
            'UPDATE reports SET admin_reply = ?, status = ? WHERE id = ?', 
            [reply, 'resolved', req.params.id]
        );
        res.json({ message: 'ตอบกลับผู้ใช้เรียบร้อย' });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ✅ 3.5 ดึงประวัติการแจ้งปัญหาของ User คนเดียว (สำหรับหน้า Home ของ User)
router.get('/reports/user/:userId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', 
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

module.exports = router;