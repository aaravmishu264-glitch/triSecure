import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function LoadingScreen({ message = 'Loading...' }) {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: theme === 'dark' ? '#0f172a' : '#f1f5f9' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{ borderTopColor: '#6366f1', borderRightColor: '#06b6d4' }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-2 rounded-full border-4 border-transparent"
            style={{ borderBottomColor: '#8b5cf6', borderLeftColor: '#f43f5e' }}
          />
        </div>
        <p className="text-lg font-medium gradient-text">{message}</p>
      </motion.div>
    </div>
  );
}
