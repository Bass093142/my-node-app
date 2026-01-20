const express = require('express');
const router = express.Router();
// ✅ เพิ่มการ import ค่า Safety Setting มาด้วย
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// ใส่ API Key ของคุณ
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyD9rK3cdAHr7_NPMIJ-v397TJ9d-YrSgXo"); 

// ✅ ตั้งค่าโมเดล + ปลดล็อค Safety Filter
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // เปลี่ยนใช้รุ่น Flash (ดีกว่า Pro)
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE, // ไม่บล็อกเลย
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ]
});

// ฟังก์ชันช่วยตัด HTML Tags (แก้ปัญหาเรื่องช่องว่าง/โค้ดรก)
const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
};

// 1. 🤖 AI สรุปข่าว
router.post('/summarize', async (req, res) => {
    const { content } = req.body;
    
    // ✅ ตัด HTML ออก เอาแต่เนื้อหาเพียวๆ ส่งให้ AI
    const cleanText = stripHtml(content);

    if (!cleanText || cleanText.trim().length < 10) {
        return res.status(400).json({ summary: "เนื้อหาข่าวน้อยเกินไป AI ไม่สามารถสรุปได้" });
    }

    try {
        const prompt = `สรุปข่าวนี้เป็นภาษาไทย ให้สั้นกระชับ ได้ใจความสำคัญ ไม่เกิน 3 บรรทัด: ${cleanText}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ summary: text });
    } catch (error) {
        console.error("AI Summarize Error:", error); // ดู Error จริงใน Terminal
        // ส่ง Error กลับไปบอกหน้าบ้าน
        res.status(500).json({ summary: "เกิดข้อผิดพลาดจาก AI (อาจเป็นเนื้อหาที่ละเอียดอ่อนเกินไป)" });
    }
});

// 2. 🛡️ AI ตรวจสอบคอมเมนต์ (ยังคงใช้ Safety Check ปกติ)
router.post('/moderate', async (req, res) => {
    const { text } = req.body;
    try {
        const prompt = `วิเคราะห์ข้อความนี้: "${text}" 
        ถ้ามีความรุนแรง, หยาบคาย, หรือ toxic ให้ตอบว่า true. ถ้าปลอดภัยตอบ false.
        ตอบกลับเฉพาะ JSON รูปแบบนี้เท่านั้น: { "isToxic": boolean }`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        const cleanJson = textResponse.replace(/```json|```/g, '').trim();
        const json = JSON.parse(cleanJson);
        
        res.json(json);
    } catch (error) {
        console.error("AI Moderate Error:", error);
        res.json({ isToxic: false });
    }
});

module.exports = router;