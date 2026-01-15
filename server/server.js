require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. เชื่อมต่อ Database (แก้ชื่อตัวแปรให้ตรงกับ Render แล้ว)
// ==========================================
const db = mysql.createConnection({
    host: process.env.DB_HOST,          // ✅ แก้เป็น DB_HOST
    user: process.env.DB_USER,          // ✅ แก้เป็น DB_USER
    password: process.env.DB_PASSWORD,  // ✅ แก้เป็น DB_PASSWORD
    database: process.env.DB_NAME || 'test', // ✅ เพิ่ม DB_NAME
    port: process.env.DB_PORT || 4000,       // ✅ เพิ่ม DB_PORT
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to TiDB:', err);
        // ให้มันแจ้งเตือนใน Logs ว่าพังเพราะอะไร
        console.error('Connection Config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            db: process.env.DB_NAME
        });
    } else {
        console.log('✅ Connected to TiDB Cloud successfully!');
    }
});

// ==========================================
// 2. หน้าแรก (Root Route)
// ==========================================
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #2da44e;">✅ Backend Server is Running!</h1>
            <p>Status: Online</p>
            <p>Database: Connected via DB_HOST</p>
        </div>
    `);
});

// ==========================================
// 3. API Routes
// ==========================================

// --- สมัครสมาชิก ---
app.post('/api/register', (req, res) => {
    const { email, password, prefix, first_name, last_name, gender, phone } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database Error: ' + err.message });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const sql = `INSERT INTO users (email, password, prefix, first_name, last_name, gender, phone, role) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`;
                     
        db.query(sql, [email, password, prefix, first_name, last_name, gender, phone], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' });
            }
            res.json({ message: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' });
        });
    });
});

// --- เข้าสู่ระบบ ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', 
    [email, password], (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0) {
            const user = results[0];
            if (user.is_banned) {
                return res.status(403).json({ message: 'บัญชีของคุณถูกระงับการใช้งาน' });
            }
            res.json(user);
        } else {
            res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

// --- ดึงข่าว ---
app.get('/api/news', (req, res) => {
    db.query('SELECT * FROM news ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ==========================================
// 4. Start Server
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});