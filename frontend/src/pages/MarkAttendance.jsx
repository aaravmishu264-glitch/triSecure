import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { loadFaceModels, detectFaces, drawDetections } from '../utils/faceApi';
import { HiShieldCheck, HiLocationMarker, HiClock, HiCamera, HiExclamation, HiInformationCircle, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MarkAttendance() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState('');
  const [results, setResults] = useState([]);
  const [marking, setMarking] = useState(false);
  const [faceCount, setFaceCount] = useState(0);

  useEffect(() => {
    fetchTimeSlots();
    getLocation();
    startCamera();
    return () => { stopCamera(); };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await API.get('/attendance/timeslots');
      setTimeSlots(res.data);
      // Auto-select the current active slot
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const activeSlot = res.data.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
      if (activeSlot) setSelectedSlot(activeSlot._id);
      else if (res.data.length > 0) setSelectedSlot(res.data[0]._id);
    } catch (err) { console.error(err); }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError('Location denied. Enable GPS.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 720 }, height: { ideal: 540 }, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setCameraOn(true); loadModelsInBackground(); };
      }
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied. Allow camera access and reload.' : err.name === 'NotFoundError' ? 'No camera found.' : 'Camera error: ' + err.message);
    }
  };

  const loadModelsInBackground = async () => {
    if (modelsLoaded || modelsLoading) return;
    setModelsLoading(true);
    try {
      await loadFaceModels();
      setModelsLoaded(true); setModelsLoading(false);
      toast.success('Face AI ready!', { duration: 2000 });
      detectLoop();
    } catch (err) { setModelsLoading(false); toast.error('AI models failed. Refresh.'); }
  };

  const detectLoop = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused) return;
    try {
      const detections = await detectFaces(videoRef.current);
      setFaceCount(detections.length);
      drawDetections(canvasRef.current, videoRef.current, detections);
    } catch (err) {}
    animRef.current = requestAnimationFrame(detectLoop);
  };

  const handleMark = async () => {
    if (!selectedSlot) { toast.error('Select a class first'); return; }
    if (!location) { toast.error('GPS not available'); return; }
    if (!modelsLoaded) { toast.error('AI still loading...'); return; }
    setMarking(true); setResults([]);
    try {
      const detections = await detectFaces(videoRef.current);
      if (detections.length === 0) { toast.error('No face detected! Look at camera.'); setMarking(false); return; }
      
      const faceDescriptors = detections.map(d => Array.from(d.descriptor));
      const res = await API.post('/attendance/mark-multi', { 
        faceDescriptors, latitude: location.lat, longitude: location.lng, timeSlotId: selectedSlot 
      });
      
      setResults(res.data.results);
      
      if (res.data.results.length > 0) {
        const presents = res.data.results.filter(r => r.status === 'PRESENT').length;
        toast.success(`Processed ${res.data.results.length} faces. ${presents} PRESENT.`);
      } else {
        toast.error('No enrolled students matched.');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setMarking(false); }
  };

  const isSlotActive = (slot) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= slot.startTime && currentTime <= slot.endTime;
  };

  // ===== SETUP GUIDE (no time slots) =====
  if (timeSlots.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full text-center">
            <div className="glass-card p-10 sm:p-14">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6366f1]/20 to-[#06b6d4]/20 flex items-center justify-center mx-auto mb-6">
                <HiInformationCircle className="text-4xl text-[#6366f1]" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Setup Required</h1>
              <p className={`text-lg mb-8 leading-relaxed ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                Your admin needs to create classroom locations and class time slots first.
              </p>
              <div className="text-left space-y-3 mb-8">
                {[
                  { num: '1', title: 'Admin creates Classroom GPS Locations', color: '#06b6d4', icon: <HiLocationMarker /> },
                  { num: '2', title: 'Admin creates Class Time Slots', color: '#f59e0b', icon: <HiClock /> },
                  { num: '3', title: 'Come back here to mark attendance', color: '#10b981', icon: <HiShieldCheck /> },
                ].map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className={`flex items-center gap-3 p-4 rounded-xl ${t ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${step.color}15`, color: step.color }}>{step.icon}</div>
                    <span className="text-base font-medium">Step {step.num}: {step.title}</span>
                  </motion.div>
                ))}
              </div>
              <button onClick={fetchTimeSlots} className="btn-secondary text-base">🔄 Refresh</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== MAIN UI =====
  return (
    <div className="page-container">
      <div className="page-content">
        {/* Top bar: Time Slots strip */}
        <div className={`shrink-0 border-b ${t ? 'border-[#1e293b]/60 bg-[#0b1120]/80' : 'border-[#e2e8f0] bg-[#f8fafc]'} backdrop-blur-lg`}>
          <div className="max-w-[1800px] mx-auto px-4 py-3">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
              <span className={`text-xs font-semibold shrink-0 mr-1 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                <HiClock className="inline mr-1" />CLASS:
              </span>
              {timeSlots.map((slot) => {
                const active = isSlotActive(slot);
                const selected = selectedSlot === slot._id;
                return (
                  <motion.button
                    key={slot._id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedSlot(slot._id)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      selected
                        ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-lg shadow-[#6366f1]/25'
                        : active
                        ? t ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:border-[#10b981]/60' : 'bg-[#10b981]/5 text-[#059669] border-[#10b981]/20 hover:border-[#10b981]/40'
                        : t ? 'bg-white/[0.04] text-[#94a3b8] border-[#1e293b] hover:border-[#334155]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]'
                    }`}
                  >
                    {active && !selected && <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />}
                    {selected && <HiCheckCircle className="text-sm" />}
                    <span className="font-semibold">{slot.className}</span>
                    <span className={`${selected ? 'text-white/70' : t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                      {slot.startTime}–{slot.endTime}
                    </span>
                    {active && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${selected ? 'bg-white/20 text-white' : 'bg-[#10b981]/20 text-[#10b981]'}`}>NOW</span>}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content: Camera + Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Camera */}
          <div className="flex-1 flex flex-col p-4 lg:p-5 min-h-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 relative rounded-2xl overflow-hidden min-h-0" style={{ background: t ? '#060a14' : '#dde3ed' }}>
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <HiExclamation className="text-5xl text-[#f43f5e] mb-4" />
                  <p className="text-[#f43f5e] font-medium mb-3 text-base">{cameraError}</p>
                  <button onClick={startCamera} className="btn-secondary">Try Again</button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
                  {cameraOn && (
                    <>
                      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-red-500/90 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                      </div>
                      {modelsLoading && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-[#f59e0b]/90 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Loading AI...
                        </div>
                      )}
                      {modelsLoaded && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-[#6366f1]/90 text-white text-xs font-semibold backdrop-blur-sm">
                          {faceCount} face{faceCount !== 1 ? 's' : ''} detected
                        </div>
                      )}
                      {/* Scanning overlay corners */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-5 left-5 w-12 h-12 border-t-2 border-l-2 border-[#6366f1]/50 rounded-tl-xl" />
                        <div className="absolute top-5 right-5 w-12 h-12 border-t-2 border-r-2 border-[#6366f1]/50 rounded-tr-xl" />
                        <div className="absolute bottom-5 left-5 w-12 h-12 border-b-2 border-l-2 border-[#6366f1]/50 rounded-bl-xl" />
                        <div className="absolute bottom-5 right-5 w-12 h-12 border-b-2 border-r-2 border-[#6366f1]/50 rounded-br-xl" />
                      </div>
                    </>
                  )}
                  {!cameraOn && !cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-3 border-transparent border-t-[#6366f1] animate-spin mb-3" />
                      <p className={`text-sm ${t ? 'text-[#475569]' : 'text-[#94a3b8]'}`}>Starting camera...</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>

            {/* Mark Button */}
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onClick={handleMark}
              disabled={marking || !cameraOn || !modelsLoaded || !selectedSlot}
              className="btn-primary w-full mt-3 py-4 text-base flex items-center justify-center gap-2 font-semibold"
              id="mark-attendance-btn"
            >
              {marking ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Verifying Face + GPS + Time...</>
              ) : (
                <>🔐 Verify & Mark Attendance</>
              )}
            </motion.button>
          </div>

          {/* Sidebar */}
          <div className={`w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l ${t ? 'border-[#1e293b]/60' : 'border-[#e2e8f0]'} overflow-y-auto p-4 lg:p-5 space-y-4`}>

            {/* GPS */}
            <div className={`p-4 rounded-xl ${t ? 'bg-white/[0.03] border border-[#1e293b]/60' : 'bg-white border border-[#e2e8f0]'}`}>
              <h3 className="font-semibold text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                <HiLocationMarker className="text-[#06b6d4]" /> GPS
              </h3>
              {location ? (
                <div className="space-y-1.5">
                  <div className={`text-xs font-mono ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-semibold"><HiCheckCircle /> Captured</div>
                </div>
              ) : locError ? (
                <div className="text-xs text-[#f43f5e]">❌ {locError} <button onClick={getLocation} className="underline ml-1">Retry</button></div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#f59e0b]">
                  <div className="w-3 h-3 rounded-full border-2 border-[#f59e0b]/30 border-t-[#f59e0b] animate-spin" /> Acquiring...
                </div>
              )}
            </div>

            {/* Pre-Check */}
            <div className={`p-4 rounded-xl ${t ? 'bg-white/[0.03] border border-[#1e293b]/60' : 'bg-white border border-[#e2e8f0]'}`}>
              <h3 className="font-semibold text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                <HiShieldCheck className="text-[#6366f1]" /> Verification Status
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Camera', ok: cameraOn, loading: !cameraOn && !cameraError },
                  { label: 'Face AI', ok: modelsLoaded, loading: modelsLoading },
                  { label: 'GPS Location', ok: !!location, loading: !location && !locError },
                  { label: 'Time Slot', ok: !!selectedSlot, loading: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                    item.ok ? 'bg-[#10b981]/8 text-[#10b981]' : item.loading ? 'bg-[#f59e0b]/8 text-[#f59e0b]' : 'bg-[#f43f5e]/8 text-[#f43f5e]'
                  }`}>
                    <span>{item.label}</span>
                    <span>{item.ok ? '✔ Ready' : item.loading ? '⏳' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            {results && results.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl ${t ? 'bg-white/[0.03] border border-[#1e293b]/60' : 'bg-white border border-[#e2e8f0]'}`}>
                <h3 className="font-semibold text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <HiShieldCheck className="text-[#6366f1]" /> Verification Results
                </h3>
                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${r.status === 'PRESENT' ? 'border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]' : r.status === 'ALREADY_MARKED' ? 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]' : 'border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e]'}`}>
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="truncate">{r.studentName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">{r.status}</span>
                      </div>
                      <p className="text-[10px] opacity-80">{r.remarks}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
