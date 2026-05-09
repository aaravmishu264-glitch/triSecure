import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiDownload, HiFilter, HiCalendar, HiSearch, HiDocumentReport } from 'react-icons/hi';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminAttendance() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [records, setRecords] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async (date) => {
    try {
      const params = date ? `?date=${date}` : '';
      const res = await API.get(`/admin/attendance${params}`);
      setRecords(res.data);
    } catch (err) { console.error(err); }
  };

  const handleExport = async () => {
    try {
      const res = await API.get('/admin/attendance/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'attendance_report.csv'; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) { toast.error('Export failed'); }
  };

  const handleExportPDF = () => {
    if (filteredRecords.length === 0) { toast.error('No records to export'); return; }
    const doc = new jsPDF();
    doc.text('TriSecure Attendance Report', 14, 15);
    
    const tableData = filteredRecords.map((r, i) => [
      i + 1,
      r.student?.name || '-',
      r.rollNumber || r.student?.rollNumber || '-',
      r.subject || r.timeSlot?.className || '-',
      new Date(r.date).toLocaleDateString(),
      r.status,
      r.remarks || '-'
    ]);

    doc.autoTable({
      head: [['#', 'Student', 'Roll No', 'Subject', 'Date', 'Status', 'Remarks']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save('attendance_report.pdf');
    toast.success('PDF exported!');
  };

  const filteredRecords = records.filter(r => {
    const sName = r.student?.name?.toLowerCase() || '';
    const sRoll = (r.rollNumber || r.student?.rollNumber || '').toLowerCase();
    const sSub = (r.subject || r.timeSlot?.className || '').toLowerCase();
    
    if (search && !sName.includes(search.toLowerCase()) && !sRoll.includes(search.toLowerCase())) return false;
    if (subjectFilter && !sSub.includes(subjectFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner flex flex-col">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Attendance Records</h1>
              <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{filteredRecords.length} records found</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <HiSearch className={`${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or roll no..." className="input-field text-sm w-40" />
              </div>
              <div className="flex items-center gap-2">
                <HiFilter className={`${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`} />
                <input type="text" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} placeholder="Subject..." className="input-field text-sm w-32" />
              </div>
              <div className="flex items-center gap-2">
                <HiCalendar className={`${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`} />
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input-field text-sm" style={{ padding: '10px 14px' }} />
              </div>
              <button onClick={() => fetchRecords(dateFilter)} className="btn-secondary">Apply Date</button>
              <button onClick={() => { setDateFilter(''); setSearch(''); setSubjectFilter(''); fetchRecords(); }} className="btn-secondary">Clear All</button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExport} className="btn-primary flex items-center gap-2" title="Export CSV">
                <HiDownload /> CSV
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleExportPDF} className="btn-primary flex items-center gap-2 bg-[#f43f5e] hover:bg-[#e11d48]" title="Export PDF">
                <HiDocumentReport /> PDF
              </motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden flex-1">
            <div className="overflow-x-auto h-full">
              <table className="data-table">
                <thead><tr><th>#</th><th>Student</th><th>Roll No</th><th>Subject</th><th>Date</th><th>Status</th><th>Face</th><th>GPS</th><th>Time</th><th>Remarks</th></tr></thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-20">
                      <p className={`text-base ${t ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>No records found</p>
                    </td></tr>
                  ) : filteredRecords.map((r, i) => (
                    <tr key={r._id}>
                      <td className={`${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{i + 1}</td>
                      <td className="font-medium">{r.student?.name || '-'}</td>
                      <td className={`text-sm ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{r.rollNumber || r.student?.rollNumber || '-'}</td>
                      <td>{r.subject || r.timeSlot?.className || '-'}</td>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td><span className={r.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}>{r.status}</span></td>
                      <td>{r.verifiedFace ? 'Yes' : 'No'}</td>
                      <td>{r.verifiedLocation ? 'Yes' : 'No'}</td>
                      <td>{r.verifiedTime ? 'Yes' : 'No'}</td>
                      <td className={`text-xs max-w-[150px] truncate ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{r.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
