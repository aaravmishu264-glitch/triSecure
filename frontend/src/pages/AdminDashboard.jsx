import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import { HiUsers, HiAcademicCap, HiClock, HiCheckCircle, HiXCircle, HiChartBar, HiArrowRight } from 'react-icons/hi';

export default function AdminDashboard() {
  const { API, user } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [stats, setStats] = useState({});
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    API.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
    API.get('/admin/attendance').then(res => setRecentAttendance(res.data.slice(0, 15))).catch(console.error);
  }, []);

  const quickLinks = [
    { to: '/admin/classrooms', icon: <HiAcademicCap />, title: 'Classrooms', desc: 'GPS locations & radius', color: '#06b6d4' },
    { to: '/admin/timeslots', icon: <HiClock />, title: 'Time Slots', desc: 'Class schedules', color: '#f59e0b' },
    { to: '/admin/students', icon: <HiUsers />, title: 'Students', desc: 'Registered accounts', color: '#8b5cf6' },
    { to: '/admin/attendance', icon: <HiChartBar />, title: 'Reports', desc: 'Records & CSV export', color: '#10b981' },
  ];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">Admin <span className="gradient-text">Dashboard</span></h1>
            <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Welcome, {user?.name}. System overview and quick actions.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={<HiUsers />} label="Students" value={stats.totalStudents || 0} color="#6366f1" delay={0} />
            <StatCard icon={<HiAcademicCap />} label="Classrooms" value={stats.totalClassrooms || 0} color="#06b6d4" delay={0.05} />
            <StatCard icon={<HiClock />} label="Time Slots" value={stats.totalSlots || 0} color="#f59e0b" delay={0.1} />
            <StatCard icon={<HiCheckCircle />} label="Present" value={stats.totalPresent || 0} color="#10b981" delay={0.15} />
            <StatCard icon={<HiXCircle />} label="Absent" value={stats.totalAbsent || 0} color="#f43f5e" delay={0.2} />
            <StatCard icon={<HiChartBar />} label="Records" value={stats.totalAttendance || 0} color="#8b5cf6" delay={0.25} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickLinks.map((link, i) => (
              <motion.div key={link.to} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                <Link to={link.to}>
                  <div className="glass-card p-5 hover:scale-[1.03] transition-transform cursor-pointer h-full flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${link.color}15`, color: link.color }}>{link.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base">{link.title}</h3>
                      <p className={`text-sm ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{link.desc}</p>
                    </div>
                    <HiArrowRight className={`text-base shrink-0 ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card overflow-hidden flex-1">
            <div className="p-6 pb-3 flex items-center justify-between">
              <h2 className="font-bold text-lg">Recent Attendance</h2>
              <Link to="/admin/attendance" className="text-sm text-[#6366f1] hover:underline font-medium">View All & Export &rarr;</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Class</th><th>Date</th><th>Status</th><th>Face</th><th>GPS</th><th>Time</th></tr></thead>
                <tbody>
                  {recentAttendance.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <p className={`text-base mb-1 ${t ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>No attendance records yet</p>
                      <p className={`text-sm ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`}>Records appear once students start marking attendance.</p>
                    </td></tr>
                  ) : recentAttendance.map((rec) => (
                    <tr key={rec._id}>
                      <td className="font-medium">{rec.student?.name || '-'}</td>
                      <td>{rec.timeSlot?.className || '-'}</td>
                      <td>{new Date(rec.date).toLocaleDateString()}</td>
                      <td><span className={rec.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}>{rec.status}</span></td>
                      <td>{rec.verifiedFace ? 'Yes' : 'No'}</td>
                      <td>{rec.verifiedLocation ? 'Yes' : 'No'}</td>
                      <td>{rec.verifiedTime ? 'Yes' : 'No'}</td>
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
