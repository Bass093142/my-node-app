const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ⚠️ ใส่ API KEY ของคุณตรงนี้ (หรือใส่ใน .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyD9rK3cdAHr7_NPMIJ-v397TJ9d-YrSgXo");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 1. 🤖 AI สรุปข่าว
router.post('/summarize', async (req, res) => {
    const { content } = req.body;
    try {
        const prompt = `สรุปข่าวนี้เป็นภาษาไทย ให้สั้นกระชับ เข้าใจง่าย ไม่เกิน 3 บรรทัด: ${content}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        res.json({ summary: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ summary: "ไม่สามารถสรุปข่าวได้ในขณะนี้ (AI Error)" });
    }
});

// 2. 🛡️ AI ตรวจสอบความรุนแรงในคอมเมนต์
router.post('/moderate', async (req, res) => {
    const { text } = req.body;
    try {
        // สั่งให้ AI ตอบเป็น JSON เท่านั้น
        const prompt = `วิเคราะห์ข้อความนี้: "${text}" 
        ถ้ามีความรุนแรง, หยาบคาย, หรือ toxic ให้ตอบว่า true. ถ้าปลอดภัยตอบ false.
        ตอบกลับเฉพาะ JSON รูปแบบนี้เท่านั้น: { "isToxic": boolean }`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        // แปลง String เป็น JSON
        const cleanJson = textResponse.replace(/```json|```/g, '').trim();
        const json = JSON.parse(cleanJson);
        
        res.json(json);
    } catch (error) {
        console.error("AI Moderate Error:", error);
        res.json({ isToxic: false }); // ถ้า AI ล่ม ให้ปล่อยผ่านไปก่อน
    }
});

module.exports = router;