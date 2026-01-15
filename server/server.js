require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// อนุญาตให้หน้าเว็บเข้าถึง Server ได้
app.use(cors());
app.use(express.json());

// ==========================================
// 1. เชื่อมต่อ Database TiDB
// ==========================================
const db = mysql.createConnection({
    host: process.env.TIDB_HOST,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: 'test',
    port: 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

db.connect((err) => {
    if (err) console.error('Error connecting to TiDB:', err);
    else console.log('✅ Connected to TiDB Cloud successfully!');
});

// ==========================================
// 2. หน้าแรก (Root Route) - แก้ปัญหา Cannot GET /
// ==========================================
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #2da44e;">✅ Backend Server is Running!</h1>
            <p>Status: Online</p>
            <p>Database: TiDB Cloud</p>
        </div>
    `);
});

// ==========================================
// 3. API Routes (ทางเข้าข้อมูล)
// ==========================================

// --- ระบบสมัครสมาชิก (Register) ---
app.post('/api/register', (req, res) => {
    const { email, password, prefix, first_name, last_name, gender, phone } = req.body;

    // 1. เช็คว่าอีเมลซ้ำไหม
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database Error' });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        // 2. บันทึกสมาชิกใหม่ (Default role = 'user')
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

// --- ระบบเข้าสู่ระบบ (Login) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', 
    [email, password], (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0) {
            const user = results[0];
            // เช็คว่าโดนแบนหรือไม่
            if (user.is_banned) {
                return res.status(403).json({ message: 'บัญชีของคุณถูกระงับการใช้งาน' });
            }
            res.json(user);
        } else {
            res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

// --- ระบบดึงข่าว (News) ---
app.get('/api/news', (req, res) => {
    db.query('SELECT * FROM news ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ==========================================
// 4. เริ่มต้น Server
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});