import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { loadFaceModels, detectSingleFace } from '../utils/faceApi';
import { HiCamera, HiCheckCircle, HiUser, HiSearch, HiRefresh, HiOutlineBadgeCheck, HiArrowRight, HiShieldCheck, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export default function FaceEnrollStation() {
  const { theme } = useTheme();
  const t = theme === 'dark';

  // Students list
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'pending', 'enrolled'

  // Enrollment flow
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enrollStage, setEnrollStage] = useState('select'); // 'select' -> 'camera' -> 'success'

  // Camera & Face State
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureInterval = useRef(null);
  const TARGET_CAPTURES = 50;

  useEffect(() => { fetchStudents(); }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (captureInterval.current) clearInterval(captureInterval.current);
    };
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/enrollment/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students');
    }
    finally { setLoading(false); }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterMode === 'pending') return matchesSearch && !s.hasFaceData;
    if (filterMode === 'enrolled') return matchesSearch && s.hasFaceData;
    return matchesSearch;
  });

  const pendingCount = students.filter(s => !s.hasFaceData).length;
  const enrolledCount = students.filter(s => s.hasFaceData).length;

  // Select a student and move to camera
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setEnrollStage('camera');
    startCamera();
  };

  const startCamera = async () => {
    setCaptureCount(0);
    setCapturing(false);
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
          };
        }
      }, 100);

      if (!modelsReady && !modelsLoading) {
        setModelsLoading(true);
        toast.loading('Loading face AI...', { id: 'models' });
        await loadFaceModels();
        setModelsReady(true);
        setModelsLoading(false);
        toast.success('Face AI ready!', { id: 'models' });
      }
    } catch (err) {
      toast.error('Camera access denied');
      setEnrollStage('select');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (captureInterval.current) { clearInterval(captureInterval.current); captureInterval.current = null; }
    setCameraReady(false);
  }, []);

  const startCapture = () => {
    if (!modelsReady) { toast.error('Face AI still loading...'); return; }
    setCapturing(true);
    setCaptureCount(0);
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
            captureInterval.current = null;
            setCapturing(false);
            toast.success(`${TARGET_CAPTURES} face samples captured!`);
            submitEnrollment(collected);
          }
        }
      } catch (err) { /* skip frame */ }
    }, 300);
  };

  const submitEnrollment = async (faceData) => {
    setSaving(true);
    try {
      const endpoint = selectedStudent.hasFaceData
        ? `/enrollment/students/${selectedStudent._id}/face`
        : `/enrollment/students/${selectedStudent._id}/face`;
      
      const method = selectedStudent.hasFaceData ? 'put' : 'post';
      await API[method](endpoint, { faceEmbeddings: faceData });

      toast.success(`${selectedStudent.name}'s face enrolled successfully!`);
      stopCamera();
      setEnrollStage('success');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save face data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    stopCamera();
    setSelectedStudent(null);
    setEnrollStage('select');
    setCaptureCount(0);
    setCapturing(false);
  };

  const handleEnrollAnother = () => {
    setSelectedStudent(null);
    setEnrollStage('select');
    setCaptureCount(0);
    setCapturing(false);
  };

  const progress = (captureCount / TARGET_CAPTURES) * 100;

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner" style={{ maxWidth: '1200px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
                <HiShieldCheck className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
              <span className="gradient-text">Face Enrollment Station</span>
            </h1>
            <p className={`text-base sm:text-lg max-w-xl mx-auto ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              Select your name, look at the camera, and enroll your face for attendance verification.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${t ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#10b981]/10 text-[#059669]'}`}>
                ✓ {enrolledCount} Enrolled
              </span>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${t ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 'bg-[#f59e0b]/10 text-[#d97706]'}`}>
                ⏳ {pendingCount} Pending
              </span>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${t ? 'bg-[#6366f1]/10 text-[#818cf8]' : 'bg-[#6366f1]/10 text-[#6366f1]'}`}>
                {students.length} Total
              </span>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ===== STAGE: SELECT STUDENT ===== */}
            {enrollStage === 'select' && (
              <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                {/* Search & Filter Bar */}
                <div className="glass-card p-4 sm:p-5 mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <HiSearch className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-11"
                        placeholder="Search by name, email, or roll number..."
                        id="student-search"
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {['all', 'pending', 'enrolled'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setFilterMode(mode)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                            filterMode === mode
                              ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25'
                              : t ? 'bg-white/[0.04] text-[#94a3b8] hover:bg-white/[0.08]' : 'bg-black/[0.03] text-[#64748b] hover:bg-black/[0.06]'
                          }`}
                          id={`filter-${mode}`}
                        >
                          {mode === 'all' ? `All (${students.length})` : mode === 'pending' ? `Pending (${pendingCount})` : `Enrolled (${enrolledCount})`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Student Cards */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-[#6366f1] animate-spin" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="glass-card p-16 text-center">
                    <HiUser className={`text-5xl mx-auto mb-3 ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`} />
                    <p className={`text-lg font-medium mb-1 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                      {students.length === 0 ? 'No students registered yet' : 'No students match your search'}
                    </p>
                    <p className={`text-sm ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>
                      {students.length === 0 ? 'Ask your admin to add students first.' : 'Try a different search or filter.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((s, i) => (
                      <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        onClick={() => handleSelectStudent(s)}
                        className="glass-card p-5 cursor-pointer group transition-all hover:shadow-xl hover:shadow-[#6366f1]/5"
                        id={`student-card-${s._id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                            s.hasFaceData
                              ? 'bg-[#10b981]/15 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'bg-[#f59e0b]/10'
                          }`}>
                            {s.hasFaceData
                              ? <HiCheckCircle className="text-2xl text-[#10b981]" />
                              : <HiUser className="text-2xl text-[#f59e0b]" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-base truncate">{s.name}</h3>
                            <p className={`text-sm truncate ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{s.email}</p>
                            {s.rollNumber && (
                              <p className={`text-xs mt-0.5 font-medium ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>{s.rollNumber} {s.department ? `• ${s.department}` : ''}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                              s.hasFaceData
                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                            }`}>
                              {s.hasFaceData ? 'Enrolled' : 'Pending'}
                            </span>
                            <HiArrowRight className={`text-lg transition-transform group-hover:translate-x-1 ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Refresh button */}
                <div className="text-center mt-8">
                  <button onClick={fetchStudents} className="btn-secondary flex items-center gap-2 mx-auto" id="refresh-students">
                    <HiRefresh /> Refresh List
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== STAGE: CAMERA CAPTURE ===== */}
            {enrollStage === 'camera' && selectedStudent && (
              <motion.div key="camera" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="glass-card p-6 sm:p-8 max-w-2xl mx-auto">
                  
                  {/* Student info header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        selectedStudent.hasFaceData ? 'bg-[#f59e0b]/15' : 'bg-[#6366f1]/15'
                      }`}>
                        <HiCamera className={`text-2xl ${selectedStudent.hasFaceData ? 'text-[#f59e0b]' : 'text-[#6366f1]'}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                        <p className={`text-sm ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                          {selectedStudent.hasFaceData ? 'Re-enrolling face data' : 'New face enrollment'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleBack}
                      className={`p-2 rounded-xl transition-colors ${t ? 'hover:bg-white/10 text-[#94a3b8]' : 'hover:bg-black/5 text-[#64748b]'}`}
                    >
                      <HiX className="text-xl" />
                    </button>
                  </div>

                  {/* Camera feed */}
                  <div
                    className="relative rounded-2xl overflow-hidden mb-5 border-4 border-[#6366f1]/20 shadow-xl"
                    style={{ minHeight: 320, background: t ? '#0f172a' : '#e2e8f0' }}
                  >
                    <video
                      ref={videoRef}
                      className="w-full rounded-2xl object-cover"
                      style={{ transform: 'scaleX(-1)', height: 360 }}
                      playsInline
                      muted
                    />
                    {capturing && (
                      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Capturing {captureCount}/{TARGET_CAPTURES}...
                      </div>
                    )}
                    {!cameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-[#6366f1] animate-spin mb-3" />
                        <p className="text-white font-medium">Initializing Camera...</p>
                      </div>
                    )}
                    {/* Scanning frame overlay */}
                    {cameraReady && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/30 rounded-full relative">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#6366f1] rounded-full shadow-[0_0_15px_#6366f1]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className={`h-4 rounded-full overflow-hidden ${t ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 100 }}
                      />
                    </div>
                    <p className={`text-xs text-center mt-3 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                      {captureCount > 0
                        ? `${captureCount} of ${TARGET_CAPTURES} samples captured — keep looking at the camera`
                        : 'Slowly turn your head left, right, up, and down during capture for best results.'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleBack}
                      className="btn-secondary flex-1"
                    >
                      ← Back to List
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startCapture}
                      disabled={capturing || !modelsReady || !cameraReady || saving}
                      className="btn-primary flex-[2] flex items-center justify-center gap-2 py-3 text-base"
                      id="start-capture-btn"
                    >
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Saving...</>
                      ) : capturing ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Capturing...</>
                      ) : modelsLoading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Loading AI...</>
                      ) : (
                        <><HiCamera className="text-xl" /> Start Face Capture</>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== STAGE: SUCCESS ===== */}
            {enrollStage === 'success' && selectedStudent && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="glass-card p-10 sm:p-14 max-w-lg mx-auto text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-28 h-28 bg-[#10b981]/15 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <HiOutlineBadgeCheck className="text-7xl text-[#10b981]" />
                  </motion.div>

                  <h2 className="text-3xl font-black mb-2">Face Enrolled!</h2>
                  <p className={`text-lg mb-2 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    <span className="font-bold text-[#6366f1]">{selectedStudent.name}</span>
                  </p>
                  <p className={`text-sm mb-8 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                    {TARGET_CAPTURES} face samples have been securely stored. You can now use face verification for attendance.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEnrollAnother}
                      className="btn-primary px-8 py-3 text-lg flex items-center gap-2 justify-center"
                      id="enroll-another-btn"
                    >
                      <HiUser /> Enroll Next Student
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
