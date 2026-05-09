import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import { HiCheckCircle, HiXCircle, HiCalendar, HiChartBar, HiArrowRight, HiShieldCheck } from 'react-icons/hi';

export default function StudentDashboard() {
  const { API, user } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([API.get('/attendance/stats'), API.get('/attendance/history')]);
      setStats(statsRes.data);
      setHistory(historyRes.data.slice(0, 10));
    } catch (err) { console.error(err); }
  };

  const pct = parseFloat(stats.percentage) || 0;

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">Welcome back, <span className="gradient-text">{user?.name}</span></h1>
            <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Here's your attendance overview and quick actions.</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={<HiCalendar />} label="Total Classes" value={stats.total} color="#6366f1" delay={0} />
            <StatCard icon={<HiCheckCircle />} label="Present" value={stats.present} color="#10b981" delay={0.05} />
            <StatCard icon={<HiXCircle />} label="Absent" value={stats.absent} color="#f43f5e" delay={0.1} />
            <StatCard icon={<HiChartBar />} label="Attendance %" value={`${stats.percentage}%`} color={pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e'} delay={0.15} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-2">
              <Link to="/mark-attendance" className="block h-full">
                <div className="glass-card p-6 h-full flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer" style={{ borderLeft: '3px solid #6366f1' }}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#06b6d4]/20 flex items-center justify-center shrink-0">
                    <HiShieldCheck className="text-2xl text-[#6366f1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">Mark Attendance</h3>
                    <p className={`text-sm ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Open camera &rarr; Face + GPS + Time verification</p>
                  </div>
                  <HiArrowRight className="text-xl text-[#6366f1] shrink-0" />
                </div>
              </Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user?.hasFaceData ? 'bg-[#10b981]/15' : 'bg-[#f43f5e]/15'}`}>
                  <HiShieldCheck className={`text-xl ${user?.hasFaceData ? 'text-[#10b981]' : 'text-[#f43f5e]'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Face Verification Status</h3>
                  <p className={`text-sm ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    {user?.hasFaceData ? 'Your face data is registered and active.' : 'No face data. Re-register to capture face samples.'}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-xl text-xs font-bold ${user?.hasFaceData ? 'verify-success' : 'verify-fail'}`}>
                {user?.hasFaceData ? 'Active' : 'Missing'}
              </span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden flex-1">
            <div className="p-6 pb-3 flex items-center justify-between">
              <h2 className="font-bold text-lg">Recent Attendance</h2>
              {history.length > 0 && <Link to="/history" className="text-sm text-[#6366f1] hover:underline font-medium">View All &rarr;</Link>}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Class</th><th>Status</th><th>Face</th><th>GPS</th><th>Time</th><th>Remarks</th></tr></thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <p className={`text-base mb-1 ${t ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>No attendance records yet</p>
                      <p className={`text-sm ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`}>Mark your first attendance to see records here.</p>
                    </td></tr>
                  ) : history.map((rec, i) => (
                    <tr key={rec._id || i}>
                      <td>{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="font-medium">{rec.timeSlot?.className || '-'}</td>
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
