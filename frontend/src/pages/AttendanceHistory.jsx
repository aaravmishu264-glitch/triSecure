import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AttendanceHistory() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.get('/attendance/history').then(res => setHistory(res.data)).catch(console.error);
  }, []);

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner flex flex-col">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Attendance History</h1>
            <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              Complete log of all your attendance records with verification details.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Date</th><th>Class</th><th>Time Window</th><th>Status</th><th>Face</th><th>GPS</th><th>Time</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-20">
                      <p className={`text-base ${t ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>No attendance records found</p>
                    </td></tr>
                  ) : history.map((rec, i) => (
                    <tr key={rec._id}>
                      <td className={`${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{i + 1}</td>
                      <td>{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="font-medium">{rec.timeSlot?.className || '-'}</td>
                      <td className={`text-sm ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{rec.timeSlot ? `${rec.timeSlot.startTime} - ${rec.timeSlot.endTime}` : '-'}</td>
                      <td><span className={rec.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}>{rec.status}</span></td>
                      <td>{rec.verifiedFace ? 'Yes' : 'No'}</td>
                      <td>{rec.verifiedLocation ? 'Yes' : 'No'}</td>
                      <td>{rec.verifiedTime ? 'Yes' : 'No'}</td>
                      <td className={`text-xs max-w-[200px] truncate ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{rec.remarks || '-'}</td>
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
