const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post('/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "No API Key configured" });
    }
    
    const prompt = `สรุปข่าวต่อไปนี้ให้กระชับ เข้าใจง่าย ไม่เกิน 3 บรรทัด เป็นภาษาไทย:\n\n${content}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text() });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI Failed" });
  }
});

module.exports = router;