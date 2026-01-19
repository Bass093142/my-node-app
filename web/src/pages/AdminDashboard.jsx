import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบสิทธิ์ Admin (Security Check)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      Swal.fire('เข้าถึงไม่ได้', 'คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้', 'error');
      navigate('/');
    } else {
      fetchData();
    }
  }, [navigate]);

  // ฟังก์ชันดึงข้อมูลทั้งหมด
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. ดึงรายชื่อ User
      const resUsers = await fetch(`${apiUrl}/api/admin/users`);
      const dataUsers = await resUsers.json();
      setUsers(dataUsers);

      // 2. ดึงรายการแจ้งปัญหา
      const resReports = await fetch(`${apiUrl}/api/admin/reports`);
      const dataReports = await resReports.json();
      setReports(dataReports);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  // --- ส่วนจัดการ User ---
  const handleBanUser = async (id, currentStatus) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: !currentStatus })
      });
      if (response.ok) {
        Swal.fire('สำเร็จ', `อัปเดตสถานะผู้ใช้เรียบร้อย`, 'success');
        fetchData(); // โหลดข้อมูลใหม่
      }
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`${apiUrl}/api/admin/users/${id}`, { method: 'DELETE' });
        Swal.fire('ลบแล้ว!', 'ผู้ใช้งานถูกลบออกจากระบบ', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('ผิดพลาด', 'ลบผู้ใช้งานไม่สำเร็จ', 'error');
      }
    }
  };

  // --- ส่วนจัดการ Report ---
  const handleUpdateReport = async (id, newStatus) => {
    try {
      await fetch(`${apiUrl}/api/admin/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Config กราฟ (Mock Data ตัวอย่าง) ---
  const chartOptions = {
    chart: { id: 'user-growth', toolbar: { show: false } },
    xaxis: { categories: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'] },
    colors: ['#3b82f6'],
    title: { text: 'สถิติยอดวิวรวมรายเดือน (ตัวอย่าง)', style: { fontFamily: 'Sarabun' } }
  };
  const chartSeries = [{ name: 'ยอดวิว', data: [30, 40, 35, 50, 49, 90] }];

  // --- Export PDF ---
  const handleExportPDF = () => {
    const element = document.getElementById('admin-report-content');
    const opt = {
      margin: 0.5,
      filename: `report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-8 pb-10 font-sarabun">
      
      {/* Header & Export Button */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🛠️ Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">ภาพรวมระบบและการจัดการสมาชิก</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          📄 Export PDF
        </button>
      </div>

      {/* พื้นที่ที่จะถูก Export เป็น PDF */}
      <div id="admin-report-content" className="space-y-8">
        
        {/* 1. ส่วนกราฟสถิติ */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
        </div>

        {/* 2. ตารางจัดการ Users */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-blue-500 pl-3">
            จัดการผู้ใช้งาน ({users.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
                  <th className="p-3 rounded-tl-lg">ชื่อ-นามสกุล</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 rounded-tr-lg text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="p-3 text-gray-800 dark:text-gray-200">{u.first_name} {u.last_name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.is_banned ? (
                        <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded">ถูกระงับ</span>
                      ) : (
                        <span className="text-green-500 font-bold bg-green-50 px-2 py-1 rounded">ปกติ</span>
                      )}
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      {u.role !== 'admin' && (
                        <>
                          <button 
                            onClick={() => handleBanUser(u.id, u.is_banned)}
                            className={`px-3 py-1 rounded text-sm text-white transition-colors ${
                              u.is_banned ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                          >
                            {u.is_banned ? 'ปลดแบน' : 'แบน'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            ลบ
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. ตารางรายงานปัญหา */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white border-l-4 border-yellow-500 pl-3">
            รายการแจ้งปัญหา ({reports.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
                  <th className="p-3 rounded-tl-lg">หัวข้อปัญหา</th>
                  <th className="p-3">ผู้แจ้ง</th>
                  <th className="p-3">รายละเอียด</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 rounded-tr-lg">อัปเดตงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {reports.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-gray-500">ไม่มีรายการแจ้งปัญหา</td></tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-750">
                      <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{r.topic}</td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{r.first_name} ({r.email})</td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{r.description}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status === 'pending' ? 'รอตรวจสอบ' : r.status === 'resolved' ? 'แก้ไขแล้ว' : 'ปิดงาน'}
                        </span>
                      </td>
                      <td className="p-3">
                        <select 
                          value={r.status}
                          onChange={(e) => handleUpdateReport(r.id, e.target.value)}
                          className="text-sm border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 p-1 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                        >
                          <option value="pending">รอตรวจสอบ</option>
                          <option value="resolved">แก้ไขแล้ว</option>
                          <option value="closed">ปิดงาน</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}