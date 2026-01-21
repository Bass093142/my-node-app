import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ✅ เพิ่มบรรทัดนี้
import { ConfigProvider } from './context/ConfigContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ ครอบ App ด้วย ConfigProvider */}
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)