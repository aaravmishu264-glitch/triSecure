import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ icon, label, value, color = '#6366f1', delay = 0 }) {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-5 sm:p-6"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
