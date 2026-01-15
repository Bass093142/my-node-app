const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Import Routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');

// Use Routes
app.use('/api', authRoutes);     // เข้าด้วย /api/login, /api/register
app.use('/api/news', newsRoutes); // เข้าด้วย /api/news
app.use('/api/ai', aiRoutes);     // เข้าด้วย /api/ai/summarize

// Test Route (ไว้เช็คว่า Server ยังอยู่ดีไหม)
app.get('/', (req, res) => {
  res.send('API Server is running...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});