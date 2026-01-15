require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. สร้าง Connection Pool (ระบบต่อสายอัตโนมัติ)
// ==========================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'test',
    port: process.env.DB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    waitForConnections: true, // ถ้าคู่สายเต็ม ให้รอคิว
    connectionLimit: 10,      // รองรับ 10 สายพร้อมกัน
    queueLimit: 0
});

// เช็คว่าเชื่อมต่อได้ไหม (Test Connection)
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
        console.error('Config:', { 
            host: process.env.DB_HOST, 
            user: process.env.DB_USER 
        });
    } else {
        console.log('✅ Connected to TiDB Cloud via Pool!');
        connection.release(); // คืนสายให้คนอื่นใช้ต่อ
    }
});

// ==========================================
// 2. หน้าแรก (Root Route)
// ==========================================
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #2da44e;">✅ Backend Server is Running (Pool Mode)!</h1>
            <p>Status: Online</p>
        </div>
    `);
});

// ==========================================
// 3. API Routes
// ==========================================

// --- สมัครสมาชิก ---
app.post('/api/register', (req, res) => {
    const { email, password, prefix, first_name, last_name, gender, phone } = req.body;

    // Pool จะจัดการ connection ให้เอง ไม่ต้อง connect/end มือ
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