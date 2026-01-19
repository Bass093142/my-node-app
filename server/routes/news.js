const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ อันนี้ถูก (ถอยออกไป แล้วเข้า config)
// ==========================================
// 📰 ส่วนจัดการข่าว (News Management)
// ==========================================

// 1. ดึงข่าวทั้งหมด (หน้า Home / Admin)
// - จอยกับตาราง Categories เพื่อเอาชื่อหมวดมาแสดง
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT n.*, c.name as category_name 
            FROM news n 
            LEFT JOIN categories c ON n.category_id = c.id 
            ORDER BY n.created_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลข่าว' });
    }
});

// 2. ดึงข่าวรายตัว (หน้าอ่านข่าว)
router.get('/:id', async (req, res) => {
    try {
        const sql = `
            SELECT n.*, c.name as category_name 
            FROM news n 
            LEFT JOIN categories c ON n.category_id = c.id 
            WHERE n.id = ?
        `;
        const [rows] = await db.query(sql, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข่าวนี้' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. เพิ่มข่าวใหม่ (Create)
router.post('/', async (req, res) => {
    // รับค่าจาก Frontend
    const { title, content, category_id, image_url, author_name } = req.body;

    if (!title || !content || !category_id) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const sql = `
            INSERT INTO news (title, content, category_id, image_url, author_name) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [title, content, category_id, image_url, author_name]);
        
        res.json({ 
            status: 'ok', 
            message: 'เพิ่มข่าวเรียบร้อยแล้ว', 
            id: result.insertId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. แก้ไขข่าว (Update)
router.put('/:id', async (req, res) => {
    const { title, content, category_id, image_url } = req.body;
    try {
        const sql = `
            UPDATE news 
            SET title = ?, content = ?, category_id = ?, image_url = ? 
            WHERE id = ?
        `;
        await db.query(sql, [title, content, category_id, image_url, req.params.id]);
        res.json({ message: 'อัปเดตข่าวเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. ลบข่าว (Delete)
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบข่าวเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 👁️ ส่วนยอดวิว (Views)
// ==========================================

// 6. เพิ่มยอดวิว (ยิง API นี้ตอนเปิดหน้าข่าว)
router.post('/:id/view', async (req, res) => {
    try {
        await db.query('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'นับยอดวิวแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 💬 ส่วนคอมเมนต์ (Comments)
// ==========================================

// 7. ดึงคอมเมนต์ของข่าว (พร้อมชื่อคนเมนต์)
router.get('/:id/comments', async (req, res) => {
    try {
        // JOIN ตาราง users เพื่อให้รู้ว่าใครเป็นคนเมนต์ (ชื่อ + นามสกุล)
        const sql = `
            SELECT c.*, u.first_name, u.last_name, u.role, u.prefix 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.news_id = ?
            ORDER BY c.created_at DESC
        `;
        const [comments] = await db.query(sql, [req.params.id]);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. เพิ่มคอมเมนต์ใหม่
router.post('/:id/comments', async (req, res) => {
    const { user_id, content } = req.body;
    
    if (!user_id || !content) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    }

    try {
        const sql = 'INSERT INTO comments (news_id, user_id, content) VALUES (?, ?, ?)';
        await db.query(sql, [req.params.id, user_id, content]);
        
        res.json({ status: 'ok', message: 'คอมเมนต์เรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. ลบคอมเมนต์ (สำหรับ Admin/Offai หรือเจ้าของเมนต์)
router.delete('/comments/:commentId', async (req, res) => {
    try {
        await db.query('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
        res.json({ message: 'ลบคอมเมนต์แล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 📂 ส่วนหมวดหมู่ (Categories) - แถมให้
// ==========================================

// 10. ดึงหมวดหมู่ทั้งหมด (ใช้ตอนสร้างข่าว ใส่ใน Dropdown)
router.get('/categories/all', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;