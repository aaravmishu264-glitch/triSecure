import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { loadFaceModels, detectSingleFace } from '../utils/faceApi';
import { HiPlus, HiTrash, HiCamera, HiCheckCircle, HiUser, HiRefresh, HiX, HiArrowRight, HiOutlineBadgeCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function EnrollStudents() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';

  // Students list
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Advanced Enrollment State
  const [showAddForm, setShowAddForm] = useState(false);
  const [enrollStage, setEnrollStage] = useState('form'); // 'form' -> 'camera' -> 'success'
  const [formData, setFormData] = useState({
    name: '', rollNumber: '', department: '', section: '', email: '', phone: ''
  });
  
  // Camera & Face State
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [embeddings, setEmbeddings] = useState([]);
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
    setLoadingStudents(true);
    try {
      const res = await API.get('/admin/students/enrollment');
      setStudents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingStudents(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Move to camera stage
  const handleNext = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { toast.error('Name and Email are required'); return; }
    setEnrollStage('camera');
    startCamera();
  };

  const startCamera = async () => {
    setCaptureCount(0);
    setEmbeddings([]);
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
      setEnrollStage('form');
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
            captureInterval.current = null;
            setCapturing(false);
            setEmbeddings(collected);
            toast.success(`${TARGET_CAPTURES} face samples captured!`);
            // Auto submit after capture
            submitEnrollment(collected);
          }
        }
      } catch (err) { /* skip frame */ }
    }, 300); // Faster interval for 50 captures
  };

  const submitEnrollment = async (faceData) => {
    setSaving(true);
    try {
      await API.post('/admin/students/enroll', { 
        name: formData.name, email: formData.email, 
        rollNumber: formData.rollNumber, department: formData.department, 
        section: formData.section, phoneNumber: formData.phone,
        faceEmbeddings: faceData 
      });
      toast.success(`Student ${formData.name} enrolled successfully!`);
      stopCamera();
      setEnrollStage('success');
      fetchStudents();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to enroll student');
      // If backend fails, let them retry without recapturing face
    } finally { 
      setSaving(false); 
    }
  };

  const resetEnrollment = () => {
    setFormData({ name: '', rollNumber: '', department: '', section: '', email: '', phone: '' });
    setEnrollStage('form');
    setShowAddForm(true); // Keep form open for continuous enrollment
  };

  const cancelEnrollment = () => {
    stopCamera();
    setEnrollStage('form');
    setShowAddForm(false);
  };

  const clearFaceData = async (student) => {
    if (!confirm(`Clear face data for "${student.name}"?`)) return;
    try {
      await API.delete(`/admin/students/${student._id}/face`);
      toast.success(`Face data cleared for ${student.name}`);
      fetchStudents();
    } catch (err) { toast.error('Failed'); }
  };

  const deleteStudent = async (student) => {
    if (!confirm(`Delete "${student.name}" and all their records?`)) return;
    try {
      await API.delete(`/admin/students/${student._id}`);
      toast.success(`${student.name} deleted`);
      fetchStudents();
    } catch (err) { toast.error('Failed'); }
  };

  const progress = (captureCount / TARGET_CAPTURES) * 100;
  const enrolledCount = students.filter(s => s.hasFaceData).length;

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Student Enrollment</h1>
                <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  {students.length} students | {enrolledCount} with face data | {students.length - enrolledCount} pending face
                </p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { if (showAddForm) cancelEnrollment(); else setShowAddForm(true); }}
                  className={showAddForm ? 'btn-danger flex items-center gap-2 px-5 py-3' : 'btn-primary flex items-center gap-2 px-5 py-3'}
                  id="add-student-btn">
                  {showAddForm ? <><HiX /> Cancel Enrollment</> : <><HiPlus /> Enroll New Student</>}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Advanced Enrollment Area */}
          <AnimatePresence mode="wait">
            {showAddForm && (
              <motion.div key="enroll-box" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
                <div className="glass-card p-8 relative overflow-hidden">
                  
                  {/* Step indicators */}
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${enrollStage !== 'success' ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25' : t ? 'bg-[#1e293b] text-[#64748b]' : 'bg-[#e2e8f0] text-[#94a3b8]'}`}>1</div>
                    <div className={`w-16 h-1 rounded-full transition-colors ${enrollStage === 'camera' || enrollStage === 'success' ? 'bg-[#6366f1]' : t ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`} />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${enrollStage === 'camera' ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/25' : enrollStage === 'success' ? 'bg-[#10b981] text-white' : t ? 'bg-[#1e293b] text-[#64748b]' : 'bg-[#e2e8f0] text-[#94a3b8]'}`}>2</div>
                  </div>

                  {/* Stage 1: Form */}
                  {enrollStage === 'form' && (
                    <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleNext} className="space-y-5">
                      <h3 className="font-semibold text-xl mb-5">Student Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Full Name *</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g. Rahul Sharma" required />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Email Address *</label>
                          <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="student@edu.com" required />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Roll Number</label>
                          <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="input-field" placeholder="e.g. CS2026001" />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Department</label>
                          <input type="text" name="department" value={formData.department} onChange={handleChange} className="input-field" placeholder="e.g. Computer Science" />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Section</label>
                          <input type="text" name="section" value={formData.section} onChange={handleChange} className="input-field" placeholder="e.g. CSE-A" />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Phone Number</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" placeholder="+91 9876543210" />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" className="btn-primary flex items-center gap-2 px-8 py-3">
                          Next: Capture Face <HiArrowRight />
                        </motion.button>
                      </div>
                    </motion.form>
                  )}

                  {/* Stage 2: Camera */}
                  {enrollStage === 'camera' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
                      <div className="text-center mb-5">
                        <h3 className="font-semibold text-xl">Face Verification</h3>
                        <p className={`text-sm mt-1 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Capturing for <span className="font-bold text-[#6366f1]">{formData.name}</span></p>
                      </div>

                      <div className="relative rounded-2xl overflow-hidden mb-5 border-4 border-[#6366f1]/20 shadow-xl" style={{ minHeight: 320, background: t ? '#0f172a' : '#e2e8f0' }}>
                        <video ref={videoRef} className="w-full rounded-2xl object-cover" style={{ transform: 'scaleX(-1)', height: 360 }} playsInline muted />
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

                      <div className="mb-6">
                        <div className={`h-4 rounded-full overflow-hidden ${t ? 'bg-[#1e293b]' : 'bg-[#e2e8f0]'}`}>
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]" animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 100 }} />
                        </div>
                        <p className={`text-xs text-center mt-3 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                          Slowly turn head left, right, up, and down during capture.
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button onClick={() => { stopCamera(); setEnrollStage('form'); }} className="btn-secondary flex-1">Back</button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startCapture} disabled={capturing || !modelsReady || !cameraReady || saving} className="btn-primary flex-[2] flex items-center justify-center gap-2 py-3 text-base">
                          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Saving Enrollment...</> : 
                           capturing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Capturing...</> : 
                           <><HiCamera className="text-xl" /> Start Auto Capture</>}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Stage 3: Success */}
                  {enrollStage === 'success' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-24 h-24 bg-[#10b981]/15 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HiOutlineBadgeCheck className="text-6xl text-[#10b981]" />
                      </motion.div>
                      <h2 className="text-3xl font-bold mb-2">Verified Successfully!</h2>
                      <p className={`text-lg mb-8 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                        <span className="font-semibold text-[#6366f1]">{formData.name}</span> has been enrolled in the database with secure face recognition.
                      </p>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetEnrollment} className="btn-primary px-8 py-3 text-lg">
                        Enroll Next Student
                      </motion.button>
                    </motion.div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Students Grid */}
          {loadingStudents ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-[#6366f1] animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
              <HiUser className={`text-5xl mx-auto mb-3 ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`} />
              <p className={`text-lg font-medium mb-1 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>No students registered yet</p>
              <p className={`text-sm mb-4 ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>Click "Enroll New Student" to begin the secure enrollment process.</p>
              {!showAddForm && <button onClick={() => setShowAddForm(true)} className="btn-primary"><HiPlus className="inline mr-1" /> Enroll Student</button>}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {students.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="glass-card p-5 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        s.hasFaceData ? 'bg-[#10b981]/15 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-[#f43f5e]/10'
                      }`}>
                        {s.hasFaceData ? <HiCheckCircle className="text-2xl text-[#10b981]" /> : <HiUser className="text-2xl text-[#f43f5e]" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{s.name}</h3>
                        <p className={`text-sm truncate ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{s.email}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteStudent(s)} title="Delete student" className="p-2 rounded-xl hover:bg-[#f43f5e]/10 text-[#f43f5e] transition-colors"><HiTrash className="text-base" /></button>
                  </div>
                  <div className={`mt-2 pt-3 border-t ${t ? 'border-[#1e293b]' : 'border-[#e2e8f0]'} flex items-center justify-between`}>
                     <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${s.hasFaceData ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f43f5e]/10 text-[#f43f5e]'}`}>
                        {s.hasFaceData ? 'Verified Face' : 'Missing Face'}
                     </span>
                     {s.hasFaceData && (
                        <button onClick={() => clearFaceData(s)} className={`text-xs flex items-center gap-1 font-medium hover:underline ${t ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-black'}`}>
                          <HiRefresh /> Retake Face
                        </button>
                     )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
