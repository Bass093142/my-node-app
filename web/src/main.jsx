import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ✅ 1. ต้อง Import BrowserRouter เข้ามาด้วย
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from './context/ConfigContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ 2. เอา BrowserRouter มาครอบไว้ชั้นนอกสุด (หรือข้างใน ConfigProvider ก็ได้ แต่ต้องครอบ App) */}
    <BrowserRouter>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)