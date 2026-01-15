-- ==========================================================
-- 1. เลือก Database
-- ==========================================================
USE test;

-- ==========================================================
-- 2. ลบตารางเก่า (ทีละตาราง)
-- ==========================================================
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

-- ==========================================================
-- 3. สร้างตาราง users ก่อน
-- ==========================================================
CREATE TABLE users (
    user_id BIGINT NOT NULL AUTO_RANDOM(5),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id) CLUSTERED,
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email)
);

-- ตรวจสอบว่าสร้างสำเร็จหรือไม่
SHOW CREATE TABLE users;

-- ==========================================================
-- 4. สร้างตาราง orders
-- ==========================================================
CREATE TABLE orders (
    order_id BIGINT NOT NULL AUTO_RANDOM(5),
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TINYINT DEFAULT 1,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id) CLUSTERED,
    KEY idx_user_id (user_id)
);

-- ตรวจสอบว่าสร้างสำเร็จหรือไม่
SHOW CREATE TABLE orders;

-- ==========================================================
-- 5. ดูตารางทั้งหมด
-- ==========================================================
SHOW TABLES;

-- ==========================================================
-- 6. เพิ่มข้อมูล
-- ==========================================================
INSERT INTO users (username, email) VALUES 
('somchai', 'somchai@example.com'),
('somsri', 'somsri@example.com'),
('manee', 'manee@example.com');

-- เช็คว่า insert สำเร็จ
SELECT * FROM users;

-- Insert orders
INSERT INTO orders (user_id, total_amount, order_date) 
SELECT user_id, 1500.00, '2024-01-15 10:00:00' 
FROM users WHERE username = 'somchai' LIMIT 1;

INSERT INTO orders (user_id, total_amount, order_date) 
SELECT user_id, 2500.50, '2024-01-16 14:30:00' 
FROM users WHERE username = 'somsri' LIMIT 1;

INSERT INTO orders (user_id, total_amount, order_date) 
SELECT user_id, 300.00, '2024-02-01 09:00:00' 
FROM users WHERE username = 'somchai' LIMIT 1;

-- ==========================================================
-- 7. ตรวจสอบผลลัพธ์
-- ==========================================================
SELECT * FROM orders;

SELECT 
    u.username, 
    COUNT(o.order_id) as total_orders, 
    SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.username;