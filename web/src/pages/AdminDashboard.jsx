import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user')); // ดึงข้อมูลคนล็อกอิน
  const isSuperAdmin = user?.role === 'admin'; // เช็คสิทธิ์ขั้นสูง

  // Mock Data (ของจริงต้อง Fetch จาก API/TiDB)
  const [stats, setStats] = useState({
    views: [30, 40, 35, 50, 49, 60, 70, 91, 125],
    categories: ['การเมือง', 'กีฬา', 'เทคโนโลยี', 'บันเทิง']
  });

  // --- Config ApexCharts ---
  const chartOptions = {
    chart: { id: 'news-views-chart' },
    xaxis: { categories: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.'] },
    title: { text: 'ยอดวิวรวมรายเดือน', style: { fontFamily: 'Sarabun' } }
  };
  const chartSeries = [{ name: 'ยอดวิว', data: stats.views }];

  // --- PDF Export Function (ภาษาไทย) ---
  const handleExportPDF = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin:       0.5,
      filename:     `monthly_report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // เทคนิคสำคัญ: html2pdf จะ render สิ่งที่เห็น ถ้าหน้าเว็บเป็น font Sarabun แล้ว PDF จะได้ด้วย
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">แผงควบคุมหลังบ้าน ({user.role})</h1>
        <button 
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
        >
          📄 Export PDF
        </button>
      </div>

      {/* --- ส่วนที่จะ Export เป็น PDF --- */}
      <div id="report-content" className="bg-white p-6 rounded-lg shadow-lg font-sarabun">
        <h2 className="text-xl font-bold mb-4 text-center">รายงานสรุปภาพรวมระบบข่าว</h2>
        
        {/* กราฟ ApexCharts */}
        <div className="mb-8">
          <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
        </div>

        {/* ตารางข้อมูล (ตัวอย่าง) */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">หมวดหมู่</th>
              <th className="p-2 border">ยอดวิวรวม</th>
              <th className="p-2 border">จำนวนข่าว</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border">การเมือง</td><td className="p-2 border">1,200</td><td className="p-2 border">50</td></tr>
            <tr><td className="p-2 border">เทคโนโลยี</td><td className="p-2 border">3,500</td><td className="p-2 border">20</td></tr>
          </tbody>
        </table>
      </div>

      {/* --- ส่วนจัดการ Users (แสดงเฉพาะ Admin/Offai) --- */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">จัดการผู้ใช้งาน</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-50">
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">สถานะ</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock User Data */}
              <tr className="border-b">
                <td className="p-3">user01</td>
                <td className="p-3">User</td>
                <td className="p-3 text-green-600">ปกติ</td>
                <td className="p-3">
                  {/* Offai ทำได้แค่ดู/ตอบคำถาม แต่ Admin มีปุ่มลบ/แบน */}
                  <button className="text-blue-500 mr-2">ดูรายละเอียด</button>
                  
                  {isSuperAdmin && (
                    <>
                      <button className="text-orange-500 mr-2">แบนชั่วคราว</button>
                      <button className="text-red-500">ลบผู้ใช้</button>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}