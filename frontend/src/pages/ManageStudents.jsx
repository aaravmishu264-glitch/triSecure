import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiTrash, HiUser } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ManageStudents() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [students, setStudents] = useState([]);

  useEffect(() => {
    API.get('/admin/students').then(res => setStudents(res.data)).catch(console.error);
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete student "${name}" and all their records?`)) return;
    try {
      await API.delete(`/admin/students/${id}`);
      toast.success(`"${name}" deleted`);
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Registered Students</h1>
            <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
          </motion.div>

          {students.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
              <HiUser className={`text-5xl mx-auto mb-3 ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`} />
              <p className={`text-lg font-medium mb-1 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>No students registered yet</p>
              <p className={`text-sm ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>Students will appear here after they sign up.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {students.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#6366f1]/15 flex items-center justify-center shrink-0">
                      <HiUser className="text-lg text-[#6366f1]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{s.name}</h3>
                      <p className={`text-sm truncate ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${s.faceEmbeddings?.length > 0 ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f43f5e]/15 text-[#f43f5e]'}`}>
                      {s.faceEmbeddings?.length > 0 ? 'Face OK' : 'No Face'}
                    </span>
                    <button onClick={() => handleDelete(s._id, s.name)} className="btn-danger text-xs px-3 py-1.5"><HiTrash /></button>
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
