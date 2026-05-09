import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { HiShieldCheck, HiLocationMarker, HiClock, HiUsers, HiArrowRight, HiLightningBolt, HiCheckCircle, HiCamera } from 'react-icons/hi';

export default function Landing() {
  const { theme } = useTheme();
  const t = theme === 'dark';

  const features = [
    { icon: <HiShieldCheck />, title: 'AI Face Recognition', desc: "Real-time deep learning models verify each student's identity in milliseconds using webcam — no hardware required.", color: '#6366f1' },
    { icon: <HiLocationMarker />, title: 'GPS Geofencing', desc: "Uses browser geolocation to confirm students are physically within the classroom's GPS radius.", color: '#06b6d4' },
    { icon: <HiClock />, title: 'Schedule Enforcement', desc: 'Attendance can only be recorded during the admin-defined class time window. No early or late marking.', color: '#f59e0b' },
    { icon: <HiUsers />, title: 'Multi-Student Detection', desc: 'Detect and verify multiple students in a single camera frame simultaneously.', color: '#10b981' },
  ];

  const steps = [
    { num: '01', title: 'Register & Scan Face', desc: 'Create your account, then capture 50 face samples from different angles for accurate recognition.', icon: <HiUsers className="text-2xl" /> },
    { num: '02', title: 'Admin Sets Up Classes', desc: 'The admin adds classroom GPS coordinates and defines class time slots.', icon: <HiClock className="text-2xl" /> },
    { num: '03', title: 'Mark Attendance', desc: 'Open the camera, and the system verifies your face, location, and time — all in one click.', icon: <HiCheckCircle className="text-2xl" /> },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ===== HERO SECTION ===== */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '0 1.5rem',
      }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '700px', height: '700px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(140px)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '-160px', width: '600px', height: '600px', borderRadius: '50%', background: 'rgba(6,182,212,0.07)', filter: 'blur(140px)' }} />
          <div style={{ position: 'absolute', bottom: '40px', right: '40px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(120px)' }} />
        </div>

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '999px',
              fontSize: '14px', fontWeight: 700, letterSpacing: '0.01em',
              marginBottom: '32px',
              background: t ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)',
              color: t ? '#a5b4fc' : '#6366f1',
              border: `1px solid ${t ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.18)'}`,
            }}>
              <HiLightningBolt style={{ color: '#fbbf24', fontSize: '16px' }} />
              Triple-Layer Verification Security
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: '24px',
              letterSpacing: '-0.03em',
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            }}
          >
            <span className="gradient-text" style={{ display: 'block', fontSize: 'clamp(3.2rem, 8.5vw, 6rem)' }}>
              TriSecure
            </span>
            <span style={{ color: t ? '#f1f5f9' : '#0f172a', display: 'block', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800 }}>
              Smart Attendance
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{
              fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)',
              maxWidth: '680px',
              margin: '0 auto 40px',
              lineHeight: 1.7,
              color: t ? '#94a3b8' : '#475569',
              fontWeight: 400,
            }}
          >
            The next generation of classroom attendance — powered by{' '}
            <strong style={{ color: '#6366f1', fontWeight: 700 }}>AI face recognition</strong>,{' '}
            <strong style={{ color: '#06b6d4', fontWeight: 700 }}>GPS geofencing</strong>, and{' '}
            <strong style={{ color: '#f59e0b', fontWeight: 700 }}>schedule enforcement</strong>.
            Attendance is marked{' '}
            <strong style={{ color: '#10b981', fontWeight: 800 }}>PRESENT</strong>{' '}
            only when all three checks pass.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '48px' }}
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 10px 40px rgba(99,102,241,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                style={{ fontSize: '18px', padding: '16px 40px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                id="signup-cta"
              >
                Create Account <HiArrowRight />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary"
                style={{ fontSize: '18px', padding: '16px 40px', borderRadius: '18px', fontWeight: 600 }}
                id="login-cta"
              >
                Sign In
              </motion.button>
            </Link>
            <Link to="/enroll">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  fontSize: '18px', padding: '16px 40px', borderRadius: '18px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                  transition: 'all 0.3s ease',
                }}
                id="enroll-cta"
              >
                <HiCamera /> Face Enrollment
              </motion.button>
            </Link>
          </motion.div>

          {/* Triple verification visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
          >
            <div className="glass-card" style={{ padding: '32px 36px' }}>
              <p style={{
                textAlign: 'center', fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.15em',
                marginBottom: '24px',
                color: t ? '#64748b' : '#94a3b8',
              }}>
                How Triple Verification Works
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                {[
                  { icon: <HiShieldCheck style={{ fontSize: '36px', color: '#6366f1' }} />, bg: '#6366f1', label: 'Face Match' },
                  null,
                  { icon: <HiLocationMarker style={{ fontSize: '36px', color: '#06b6d4' }} />, bg: '#06b6d4', label: 'GPS Match' },
                  null,
                  { icon: <HiClock style={{ fontSize: '36px', color: '#f59e0b' }} />, bg: '#f59e0b', label: 'Time Match' },
                  'equals',
                  { icon: <span style={{ fontSize: '36px' }}>🎉</span>, bg: '#10b981', label: 'PRESENT' },
                ].map((item, i) => {
                  if (item === null) return (
                    <span key={i} style={{ fontSize: '28px', fontWeight: 900, color: t ? '#334155' : '#cbd5e1' }}>+</span>
                  );
                  if (item === 'equals') return (
                    <span key={i} style={{ fontSize: '28px', fontWeight: 900, color: t ? '#334155' : '#cbd5e1' }}>=</span>
                  );
                  return (
                    <motion.div key={i} whileHover={{ scale: 1.1, y: -4 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '80px', height: '80px', borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${item.bg}15`,
                        transition: 'transform 0.2s',
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', color: item.bg }}>
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '24px', height: '40px', borderRadius: '999px',
              border: `2px solid ${t ? '#334155' : '#cbd5e1'}`,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8px',
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: '96px 0', background: t ? '#0b1120' : '#ffffff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{
              fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.15em', marginBottom: '12px', color: '#6366f1',
            }}>
              Simple Process
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>
              <span className="gradient-text">How It Works</span>
            </h2>
            <p style={{
              fontSize: '1.1rem', marginTop: '14px', maxWidth: '520px', margin: '14px auto 0',
              color: t ? '#94a3b8' : '#64748b', lineHeight: 1.6,
            }}>
              Get started in three simple steps
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    fontSize: '5rem', fontWeight: 900, lineHeight: 1, opacity: 0.15,
                    userSelect: 'none',
                  }} className="gradient-text">
                    {step.num}
                  </div>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '56px', height: '56px', borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: t ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)',
                    color: t ? '#818cf8' : '#6366f1',
                    transition: 'transform 0.2s',
                  }}>
                    {step.icon}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '16px', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '320px', margin: '0 auto',
                  color: t ? '#94a3b8' : '#64748b',
                }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{
              fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.15em', marginBottom: '12px', color: '#06b6d4',
            }}>
              Powerful Features
            </p>
            <h2 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>
              <span className="gradient-text">Core Features</span>
            </h2>
            <p style={{
              fontSize: '1.1rem', marginTop: '14px', maxWidth: '520px', margin: '14px auto 0',
              color: t ? '#94a3b8' : '#64748b', lineHeight: 1.6,
            }}>
              Enterprise-grade attendance with zero hardware cost
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="glass-card"
                style={{ padding: '32px', textAlign: 'center', cursor: 'default' }}
              >
                <div style={{
                  width: '68px', height: '68px', borderRadius: '20px',
                  margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px',
                  background: `${f.color}12`, color: f.color,
                  transition: 'transform 0.3s',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.65, color: t ? '#94a3b8' : '#64748b' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ENROLLMENT BANNER ===== */}
      <section style={{ padding: '60px 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{
            maxWidth: '900px', margin: '0 auto',
            overflow: 'hidden', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent, rgba(6,182,212,0.08))',
          }} />
          <div style={{ position: 'relative', zIndex: 10, padding: '48px 56px', textAlign: 'center' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <HiCamera style={{ fontSize: '28px', color: '#10b981' }} />
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800,
              marginBottom: '12px', letterSpacing: '-0.02em',
            }}>
              Student Face Enrollment Station
            </h2>
            <p style={{
              fontSize: '1.05rem', marginBottom: '28px', maxWidth: '520px', margin: '0 auto 28px',
              color: t ? '#94a3b8' : '#64748b', lineHeight: 1.6,
            }}>
              Students can enroll their face directly — no need to enter details each time.
              Just select your name and look at the camera.
            </p>
            <Link to="/enroll">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(16,185,129,0.35)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  padding: '16px 40px', borderRadius: '18px',
                  fontSize: '18px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.3s ease',
                }}
                id="enroll-station-btn"
              >
                <HiCamera /> Open Enrollment Station <HiArrowRight />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section style={{ padding: '60px 1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card"
          style={{
            maxWidth: '900px', margin: '0 auto',
            overflow: 'hidden', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(99,102,241,0.1), transparent, rgba(6,182,212,0.1))',
          }} />
          <div style={{ position: 'relative', zIndex: 10, padding: '48px 56px', textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 800,
              marginBottom: '14px', letterSpacing: '-0.02em',
            }}>
              Ready to get started?
            </h2>
            <p style={{
              fontSize: '1.05rem', marginBottom: '28px', maxWidth: '520px', margin: '0 auto 28px',
              color: t ? '#94a3b8' : '#64748b', lineHeight: 1.6,
            }}>
              Join TriSecure and bring intelligent, tamper-proof attendance to your classroom today.
            </p>
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(99,102,241,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                style={{
                  fontSize: '18px', padding: '16px 40px', borderRadius: '18px',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  fontWeight: 700,
                }}
              >
                Get Started Free <HiArrowRight />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        borderTop: `1px solid ${t ? '#1e293b' : '#e2e8f0'}`,
        padding: '40px 0',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.9rem', color: t ? '#475569' : '#94a3b8', fontWeight: 500 }}>
          © 2026 TriSecure. Intelligent Attendance Verification System.
        </p>
      </footer>
    </div>
  );
}
