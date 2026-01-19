const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ✅ เรียกใช้ Database

// ==========================================
// 📰 1. ส่วนจัดการข่าว (News Management)
// ==========================================

// 1.1 ดึงข่าวทั้งหมด (สำหรับหน้าแรก / Admin)
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

// 1.2 ดึงข่าวรายตัว (สำหรับหน้าอ่านข่าว NewsDetail)
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

// 1.3 เพิ่มข่าวใหม่ (Create)
router.post('/', async (req, res) => {
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

// 1.4 แก้ไขข่าว (Update)
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

// 1.5 ลบข่าว (Delete)
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบข่าวเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 👁️ 2. ส่วนยอดวิว (Views)
// ==========================================

// เพิ่มยอดวิวทีละ 1 (เรียกใช้ตอนกดอ่านข่าว)
router.post('/:id/view', async (req, res) => {
    try {
        await db.query('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
        res.json({ message: 'นับยอดวิวแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 📂 3. ส่วนจัดการหมวดหมู่ (Categories CRUD)
// ==========================================

// 3.1 ดึงหมวดหมู่ทั้งหมด (ใช้ในหน้าแรก และ Dropdown)
router.get('/categories/all', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3.2 เพิ่มหมวดหมู่ใหม่
router.post('/categories', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
        res.json({ message: 'เพิ่มหมวดหมู่สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3.3 แก้ไขชื่อหมวดหมู่
router.put('/categories/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, req.params.id]);
        res.json({ message: 'แก้ไขหมวดหมู่สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3.4 ลบหมวดหมู่ (มีระบบป้องกันถ้ามีข่าวใช้อยู่)
router.delete('/categories/:id', async (req, res) => {
    try {
        // เช็คก่อนว่ามีข่าวในหมวดหมู่นี้ไหม
        const [check] = await db.query('SELECT * FROM news WHERE category_id = ?', [req.params.id]);
        if (check.length > 0) {
            return res.status(400).json({ message: 'ไม่สามารถลบได้ เนื่องจากมีข่าวในหมวดหมู่นี้อยู่' });
        }
        
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 💬 4. ส่วนคอมเมนต์ (Comments - เผื่อใช้)
// ==========================================

// ดึงคอมเมนต์ของข่าวนั้นๆ
router.get('/:id/comments', async (req, res) => {
    try {
        const sql = `
            SELECT c.*, u.first_name, u.last_name, u.role, u.prefix, u.profile_image
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

// โพสต์คอมเมนต์
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

// ลบคอมเมนต์
router.delete('/comments/:commentId', async (req, res) => {
    try {
        await db.query('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
        res.json({ message: 'ลบคอมเมนต์แล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;