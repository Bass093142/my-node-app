const express = require('express');
const router = express.Router();
const db = require('../config/db');

// บันทึก Log การยอมรับ Cookie
router.post('/consent', async (req, res) => {
    const { user_id, ip_address, user_agent } = req.body;
    try {
        await db.query(
            'INSERT INTO cookie_logs (user_id, ip_address, user_agent) VALUES (?, ?, ?)',
            [user_id || null, ip_address, user_agent]
        );
        res.json({ message: 'Consent logged' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Log failed' });
    }
});

module.exports = router;