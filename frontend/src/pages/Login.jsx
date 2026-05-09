import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiMail, HiLockClosed, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const t = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-content items-center justify-center px-4">
        {/* Background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-[#6366f1]/[0.06] blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-[#06b6d4]/[0.06] blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 sm:p-12 w-full max-w-md relative"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#6366f1]/20">
              <HiShieldCheck className="text-white text-4xl" />
            </div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className={`text-sm mt-2 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Sign in to TriSecure</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Email</label>
              <div className="relative">
                <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] text-lg" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-12" placeholder="name@example.com" required id="login-email" />
              </div>
            </div>
            <div>
              <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Password</label>
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] text-lg" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-12" placeholder="Password" required id="login-password" />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base"
              id="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <p className={`text-center text-sm mt-8 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
            Don't have an account? <Link to="/signup" className="text-[#6366f1] font-semibold hover:underline">Sign Up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
