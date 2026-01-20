const express = require('express');
const router = express.Router();
// ✅ 1. Import ค่า Safety Settings มาด้วย
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// ใส่ API Key ที่คุณให้มา
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyD9rK3cdAHr7_NPMIJ-v397TJ9d-YrSgXo"); 

// ✅ 2. ตั้งค่าโมเดล + ปลดล็อค Safety Filter (BLOCK_NONE)
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // ใช้รุ่น Flash เร็วและฟรี
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

// ฟังก์ชันล้าง HTML Tags ออก (ช่วยให้ AI อ่านง่ายขึ้นและประหยัด Token)
const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
};

// ------------------------------------------
// Route 1: สรุปข่าว (Summarize)
// ------------------------------------------
router.post('/summarize', async (req, res) => {
    const { content } = req.body;
    
    // ล้าง HTML ออกก่อนส่ง
    const cleanText = stripHtml(content);

    // ถ้าเนื้อหาน้อยเกินไป ไม่ต้องส่งไปถาม AI
    if (!cleanText || cleanText.trim().length < 20) {
        return res.status(400).json({ summary: "เนื้อหาข่าวสั้นเกินไป AI ไม่สามารถสรุปได้" });
    }

    try {
        const prompt = `สรุปข่าวนี้เป็นภาษาไทย ให้สั้นกระชับ ได้ใจความสำคัญ ไม่เกิน 3 บรรทัด (สรุปตามข้อเท็จจริงโดยไม่ต้องกังวลเรื่องความรุนแรง): ${cleanText}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ summary: text });
    } catch (error) {
        console.error("AI Summarize Error:", error); 
        // ถ้ายัง Error อีก แสดงว่าเป็นที่ระบบ Google ชั่วคราว
        res.status(500).json({ summary: "ระบบ AI ขัดข้องชั่วคราว (กรุณาลองใหม่)" });
    }
});

// ------------------------------------------
// Route 2: ตรวจสอบคำหยาบ (Moderate)
// ------------------------------------------
router.post('/moderate', async (req, res) => {
    const { text } = req.body;
    try {
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
        // ถ้า AI ล่ม ให้ปล่อยผ่านไปก่อน (User จะได้คอมเมนต์ได้)
        res.json({ isToxic: false });
    }
});

module.exports = router;