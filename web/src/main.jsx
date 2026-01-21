import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ✅ 1. Import ไฟล์ Context ที่สร้างเมื่อกี้
import { ConfigProvider } from './context/ConfigContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ 2. ครอบ App ด้วย ConfigProvider */}
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)