const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Setup Gemini AI ---
// ตรวจสอบว่ามี API Key หรือไม่เพื่อป้องกัน error
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Database Connection (แก้ไขสำหรับ TiDB) ---
const db = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  // TiDB มักใช้พอร์ต 4000 เป็นค่าเริ่มต้น
  port: process.env.DB_PORT || 4000, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // *** สำคัญ: เปิดใช้ SSL สำหรับเชื่อมต่อ TiDB Cloud ***
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

// --- API Routes ---

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      const user = results[0];
      // ส่งข้อมูล User กลับไป (ไม่ส่ง Password)
      res.json({ 
        id: user.id, 
        email: user.email, 
        prefix: user.prefix, 
        firstName: user.first_name, 
        lastName: user.last_name, 
        role: user.role 
      });
    } else {
      res.status(401).json({ message: 'Login failed' });
    }
  });
});

// Register
app.post('/api/register', (req, res) => {
  const { email, password, prefix, firstName, lastName, gender, phone } = req.body;
  // กำหนด role เริ่มต้นเป็น 'user'
  const sql = `INSERT INTO users (email, password, prefix, first_name, last_name, gender, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`;
  db.query(sql, [email, password, prefix, firstName, lastName, gender, phone], (err, result) => {
    if (err) return res.status(500).json({ error: 'Register failed: ' + err.message });
    res.json({ message: 'Register success' });
  });
});

// Get News
app.get('/api/news', (req, res) => {
  const sql = 'SELECT * FROM news ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add News
app.post('/api/news', (req, res) => {
  const { title, content, category, image_url, author_name } = req.body;
  const sql = 'INSERT INTO news (title, content, category, image_url, author_name) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [title, content, category, image_url, author_name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, message: 'News added' });
  });
});

// Delete News
app.delete('/api/news/:id', (req, res) => {
  const sql = 'DELETE FROM news WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'News deleted' });
  });
});

// Get Users (สำหรับ Admin)
app.get('/api/users', (req, res) => {
  const sql = 'SELECT id, email, prefix, first_name, last_name, role, phone FROM users';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted' });
  });
});

// --- AI Gemini Features ---

// Summarize News
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "No API Key configured on server" });
    
    const prompt = `สรุปข่าวต่อไปนี้ให้กระชับ เข้าใจง่าย ไม่เกิน 3 บรรทัด เป็นภาษาไทย:\n\n${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text() });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI Processing Failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});