import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiSun, HiMoon, HiLogout, HiUser, HiShieldCheck } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = theme === 'dark';

  // Hide navbar on landing page for guest users (hero has its own nav)
  const isLanding = location.pathname === '/' && !user;

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = user?.role === 'admin'
    ? [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/classrooms', label: 'Classrooms', icon: '📍' },
        { path: '/admin/timeslots', label: 'Time Slots', icon: '🕐' },
        { path: '/admin/enroll', label: 'Enrollment', icon: '📸' },
        { path: '/admin/students', label: 'Students', icon: '👥' },
        { path: '/admin/attendance', label: 'Attendance', icon: '📋' },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/mark-attendance', label: 'Mark Attendance', icon: '📸' },
        { path: '/history', label: 'History', icon: '📋' },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isLanding
        ? 'bg-transparent'
        : t ? 'bg-[#0b1120]/95 border-b border-[#1e293b]/60' : 'bg-white/95 border-b border-[#e2e8f0]'
    } backdrop-blur-2xl`}
      style={{ boxShadow: isLanding ? 'none' : (t ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)') }}>
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[#6366f1]/20 group-hover:shadow-[#6366f1]/40 transition-shadow">
              <HiShieldCheck className="text-white text-lg" />
            </div>
            <span className="text-lg font-extrabold gradient-text tracking-tight">TriSecure</span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-[#818cf8]'
                      : t ? 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]' : 'text-[#64748b] hover:text-[#1e293b] hover:bg-black/[0.03]'
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[#6366f1]" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2.5">
            <button onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all ${t ? 'hover:bg-white/10 text-[#fbbf24]' : 'hover:bg-black/5 text-[#6366f1]'}`}
              id="theme-toggle">
              {t ? <HiSun className="text-xl" /> : <HiMoon className="text-xl" />}
            </button>

            {!user && !isLanding && (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${t ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-[#1e293b]'}`}>
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm px-5 py-2 rounded-xl">
                  Sign Up
                </Link>
              </div>
            )}

            {user && (
              <>
                <div className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm ${t ? 'bg-white/[0.04]' : 'bg-black/[0.03]'}`}>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                    <HiUser className="text-white text-xs" />
                  </div>
                  <span className="font-medium max-w-[120px] truncate">{user.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    user.role === 'admin' ? 'bg-[#f59e0b]/15 text-[#f59e0b]' : 'bg-[#06b6d4]/15 text-[#06b6d4]'
                  }`}>{user.role}</span>
                </div>
                <button onClick={handleLogout}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#f43f5e] hover:bg-[#f43f5e]/10 transition-all font-medium"
                  id="logout-btn">
                  <HiLogout className="text-base" /> Logout
                </button>
              </>
            )}

            {user && (
              <button className="md:hidden p-2 rounded-xl" onClick={() => setMobileOpen(!mobileOpen)} id="mobile-menu-toggle">
                {mobileOpen ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-t ${t ? 'border-[#1e293b] bg-[#0b1120]' : 'border-[#e2e8f0] bg-white'}`}>
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path) ? 'bg-[#6366f1]/15 text-[#818cf8]' : t ? 'text-[#94a3b8]' : 'text-[#64748b]'
                  }`}>
                  <span>{link.icon}</span> {link.label}
                </Link>
              ))}
              <div className={`flex items-center justify-between px-4 py-3 mt-2 border-t ${t ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                    <HiUser className="text-white text-xs" />
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm text-[#f43f5e] font-medium">Logout</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
