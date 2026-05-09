import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiPlus, HiTrash, HiClock, HiX, HiAcademicCap, HiUserGroup } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ManageSessions() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [sessions, setSessions] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [classroom, setClassroom] = useState('');
  const [section, setSection] = useState('');
  const [teacher, setTeacher] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, roomsRes, teachersRes] = await Promise.all([
        API.get('/admin/timeslots'), 
        API.get('/admin/classrooms'),
        API.get('/admin/teachers')
      ]);
      setSessions(slotsRes.data);
      setClassrooms(roomsRes.data);
      setTeachers(teachersRes.data);
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!classroom) { toast.error('Please select a classroom'); return; }
    setSaving(true);
    try {
      await API.post('/admin/timeslots', { 
        className: subject, startTime, endTime, classroom, section, teacher 
      });
      toast.success(`Session for "${subject}" scheduled!`);
      setSubject(''); setStartTime(''); setEndTime(''); setClassroom(''); setSection(''); setTeacher('');
      setShowForm(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete session "${name}"?`)) return;
    try {
      await API.delete(`/admin/timeslots/${id}`);
      toast.success('Session deleted');
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Class Sessions</h1>
                <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  Create subject sessions, assign classrooms, times, and sections for automated attendance tracking.
                </p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(!showForm)}
                className={showForm ? 'btn-danger flex items-center gap-2 px-5 py-3' : 'btn-primary flex items-center gap-2 px-5 py-3'}
                id="add-session-btn">
                {showForm ? <><HiX /> Cancel</> : <><HiPlus /> Create Session</>}
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
                <div className="glass-card p-8">
                  <h3 className="font-semibold mb-5 text-xl">New Session Details</h3>
                  {classrooms.length === 0 ? (
                    <div className={`p-5 rounded-xl text-sm ${t ? 'bg-[#f59e0b]/5 border border-[#f59e0b]/20' : 'bg-[#f59e0b]/5 border border-[#f59e0b]/15'}`}>
                      <p className="text-[#f59e0b] font-medium mb-1">No classrooms found</p>
                      <p className={`${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Add at least one classroom location first.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleAdd} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Subject Name *</label>
                          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" placeholder="e.g. Machine Learning" required />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Section / Batch</label>
                          <input type="text" value={section} onChange={e => setSection(e.target.value)} className="input-field" placeholder="e.g. CSE-A" />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Start Time *</label>
                          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field" required />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>End Time *</label>
                          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field" required />
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Classroom *</label>
                          <select value={classroom} onChange={e => setClassroom(e.target.value)} className="input-field" required>
                            <option value="">-- Select Classroom --</option>
                            {classrooms.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Teacher (Optional)</label>
                          <select value={teacher} onChange={e => setTeacher(e.target.value)} className="input-field">
                            <option value="">-- Assign Teacher --</option>
                            {teachers.map(t => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto px-8">
                          {saving ? 'Creating...' : 'Create Session'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.length === 0 ? (
              <div className="col-span-full">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
                  <HiAcademicCap className={`text-5xl mx-auto mb-3 ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`} />
                  <p className={`text-lg font-medium mb-1 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>No sessions created yet</p>
                  <p className={`text-sm mb-4 ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>Schedule your first class session so students can mark attendance.</p>
                  {!showForm && <button onClick={() => setShowForm(true)} className="btn-primary"><HiPlus className="inline mr-1" /> Create Session</button>}
                </motion.div>
              </div>
            ) : sessions.map((s, i) => (
              <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-5 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl ${t ? 'bg-[#334155] text-white' : 'bg-[#e2e8f0] text-[#64748b]'}`}>
                  {s.section || 'All Sections'}
                </div>
                <div className="flex items-start gap-4 mb-4 mt-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1]/20 to-[#06b6d4]/20 flex items-center justify-center shrink-0">
                    <HiAcademicCap className="text-xl text-[#6366f1]" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <h3 className="font-semibold text-lg truncate">{s.className}</h3>
                    <p className={`text-sm truncate flex items-center gap-1 ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      <HiClock className="text-[#06b6d4]" /> {s.startTime} - {s.endTime}
                    </p>
                  </div>
                </div>
                <div className={`pt-3 border-t flex flex-col gap-1.5 ${t ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
                   <p className="text-xs flex justify-between">
                     <span className={t ? 'text-[#64748b]' : 'text-[#94a3b8]'}>Classroom:</span>
                     <span className="font-medium text-right">{s.classroom?.name || 'Unknown'}</span>
                   </p>
                   {/* If teacher was populated it would be an object, but we didn't populate it in backend. Let's just say "Assigned" or ID */}
                   {s.teacher && (
                     <p className="text-xs flex justify-between">
                       <span className={t ? 'text-[#64748b]' : 'text-[#94a3b8]'}>Teacher:</span>
                       <span className="font-medium text-right text-[#10b981]">Assigned</span>
                     </p>
                   )}
                </div>
                <button onClick={() => handleDelete(s._id, s.className)} className="absolute bottom-4 right-4 p-2 rounded-xl bg-[#f43f5e]/10 text-[#f43f5e] opacity-0 group-hover:opacity-100 transition-opacity">
                  <HiTrash />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
