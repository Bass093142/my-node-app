const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

// ตรวจสอบการเชื่อมต่อเบื้องต้น
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.code, err.message);
  } else {
    console.log('Connected to TiDB Cloud successfully!');
    connection.release();
  }
});

module.exports = db.promise();