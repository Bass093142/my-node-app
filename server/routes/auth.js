// ... (code เดิม)

// 1. เพิ่ม Security Question ตอน Register
router.post('/register', async (req, res) => {
    // รับ security_question, security_answer มาด้วย
    const { email, password, prefix, first_name, last_name, phone, gender, security_question, security_answer } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'อีเมลนี้ใช้ไปแล้ว' });

        await db.query(
            'INSERT INTO users (email, password, prefix, first_name, last_name, phone, gender, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?, "user", ?, ?)',
            [email, password, prefix, first_name, last_name, phone, gender, security_question, security_answer]
        );
        res.json({ status: 'ok', message: 'สมัครสมาชิกสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ฟังก์ชันกู้รหัสผ่าน (ตรวจสอบคำตอบ)
router.post('/reset-password', async (req, res) => {
    const { email, answer, newPassword } = req.body; // รับคำตอบสัตว์เลี้ยง และรหัสใหม่
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'ไม่พบอีเมลนี้' });

        const user = users[0];
        // เช็คคำตอบ (ควรระวังเรื่อง Case Sensitive ถ้าอยากให้เป๊ะ)
        if (user.security_answer !== answer) {
            return res.status(400).json({ message: 'คำตอบคำถามความปลอดภัยไม่ถูกต้อง' });
        }

        // อัปเดตรหัสผ่านใหม่
        await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, user.id]);
        res.json({ status: 'ok', message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;