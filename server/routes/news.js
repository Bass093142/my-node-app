const express = require('express');
const router = express.Router();
const db = require('../config/db');

// อ่านข่าวทั้งหมด
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
    res.status(500).json({ error: err.message });
  }
});

// เพิ่มข่าว
router.post('/', async (req, res) => {
  const { title, content, category_id, image_url, author_name } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO news (title, content, category_id, image_url, author_name) VALUES (?, ?, ?, ?, ?)', 
      [title, content, category_id, image_url, author_name]
    );
    res.json({ id: result.insertId, message: 'News added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบข่าว
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงคอมเมนต์
router.get('/:id/comments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM comments WHERE news_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เพิ่มคอมเมนต์
router.post('/comment', async (req, res) => {
  const { news_id, user_id, user_name, message } = req.body;
  try {
    await db.query(
      'INSERT INTO comments (news_id, user_id, user_name, message) VALUES (?, ?, ?, ?)', 
      [news_id, user_id, user_name, message]
    );
    res.json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;