import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiUser, HiMail, HiLockClosed, HiCamera, HiCheckCircle } from 'react-icons/hi';
import { loadFaceModels, detectSingleFace } from '../utils/faceApi';
import toast from 'react-hot-toast';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [embeddings, setEmbeddings] = useState([]);
  const [captureCount, setCaptureCount] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureInterval = useRef(null);
  const { register } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const navigate = useNavigate();

  const TARGET_CAPTURES = 30;

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (captureInterval.current) clearInterval(captureInterval.current);
    };
  }, []);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (role === 'admin') {
      handleRegister([]);
      return;
    }
    setStep(2);
    initCameraAndModels();
  };

  const initCameraAndModels = async () => {
    try {
      // Start camera FIRST
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }

      // Then load models
      toast.loading('Loading face detection AI...', { id: 'models' });
      await loadFaceModels();
      setModelsReady(true);
      toast.success('Face detection ready! Click "Start Capture" below.', { id: 'models' });
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access and try again.', { id: 'models' });
      } else {
        toast.error('Failed to initialize: ' + err.message, { id: 'models' });
      }
    }
  };

  const startCapture = () => {
    if (!modelsReady) {
      toast.error('Face detection models are still loading. Please wait...');
      return;
    }
    setCapturing(true);
    setCaptureCount(0);
    setEmbeddings([]);
    const collected = [];

    captureInterval.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const detection = await detectSingleFace(videoRef.current);
        if (detection) {
          collected.push(Array.from(detection.descriptor));
          setCaptureCount(collected.length);
          if (collected.length >= TARGET_CAPTURES) {
            clearInterval(captureInterval.current);
            setCapturing(false);
            setEmbeddings(collected);
            toast.success(`Captured ${TARGET_CAPTURES} face samples successfully!`);
          }
        }
      } catch (err) { /* skip frame */ }
    }, 500);
  };

  const handleRegister = async (faceData) => {
    setLoading(true);
    try {
      const user = await register(name, email, password, role, faceData || embeddings);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      toast.success('Account created successfully!');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const progress = (captureCount / TARGET_CAPTURES) * 100;

  return (
    <div className="page-container">
      <div className="page-content items-center justify-center px-4 py-8">
        {/* Background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-[#8b5cf6]/[0.06] blur-[120px]" />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-[#06b6d4]/[0.06] blur-[120px]" />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-card p-8 sm:p-12 w-full max-w-lg relative">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25' : t ? 'bg-[#1e293b] text-[#64748b]' : 'bg-[#e2e8f0] text-[#94a3b8]'}`}>1</div>
            <div className={`w-16 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#6366f1]' : t ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`} />
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25' : t ? 'bg-[#1e293b] text-[#64748b]' : 'bg-[#e2e8f0] text-[#94a3b8]'}`}>2</div>
          </div>

          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Create Account</h1>
                <p className={`text-sm mt-2 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  {role === 'student' ? 'Step 1: Enter your details. Step 2: Capture face data.' : 'Enter admin credentials to get started.'}
                </p>
              </div>
              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Full Name</label>
                  <div className="relative">
                    <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] text-lg" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field pl-12" placeholder="Your full name" required id="signup-name" />
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Email Address</label>
                  <div className="relative">
                    <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] text-lg" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-12" placeholder="you@example.com" required id="signup-email" />
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Password</label>
                  <div className="relative">
                    <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366f1] text-lg" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pl-12" placeholder="Min 6 characters" minLength={6} required id="signup-password" />
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Account Type</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="input-field" id="signup-role">
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="btn-primary w-full py-4 text-base" id="signup-next">
                  {loading ? 'Creating...' : role === 'admin' ? 'Create Admin Account' : 'Next → Face Verification'}
                </motion.button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">Face Verification</h1>
                <p className={`text-sm mt-2 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  We'll capture {TARGET_CAPTURES} face samples for accurate recognition. Slowly move your head left, right, up, and down during capture.
                </p>
              </div>

              {/* Camera */}
              <div className="relative rounded-2xl overflow-hidden mb-5" style={{ minHeight: 280, background: t ? '#0f172a' : '#e2e8f0' }}>
                <video ref={videoRef} className="w-full rounded-2xl" style={{ transform: 'scaleX(-1)' }} playsInline muted />
                {capturing && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Capturing...
                  </div>
                )}
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-[#6366f1] animate-spin mb-3" />
                    <p className={`text-sm ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>Starting camera...</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className={t ? 'text-[#94a3b8]' : 'text-[#64748b]'}>
                    {captureCount === 0 ? 'Ready to capture' : `Capturing face samples...`}
                  </span>
                  <span className="font-bold text-[#6366f1]">{captureCount}/{TARGET_CAPTURES}</span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${t ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]"
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {embeddings.length < TARGET_CAPTURES ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startCapture}
                    disabled={capturing || !modelsReady}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
                    id="start-capture"
                  >
                    {!modelsReady ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Loading AI Models...
                      </>
                    ) : capturing ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Capturing ({captureCount}/{TARGET_CAPTURES})...
                      </>
                    ) : (
                      <>
                        <HiCamera /> Start Face Capture
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRegister()}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
                    id="complete-signup"
                  >
                    <HiCheckCircle /> {loading ? 'Creating Account...' : 'Complete Registration'}
                  </motion.button>
                )}
              </div>
            </>
          )}

          <p className={`text-center text-sm mt-8 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
            Already have an account? <Link to="/login" className="text-[#6366f1] font-semibold hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
