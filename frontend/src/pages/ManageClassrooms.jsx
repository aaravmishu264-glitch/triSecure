import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiPlus, HiTrash, HiLocationMarker, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ManageClassrooms() {
  const { API } = useAuth();
  const { theme } = useTheme();
  const t = theme === 'dark';
  const [classrooms, setClassrooms] = useState([]);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('50');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClassrooms(); }, []);

  const fetchClassrooms = async () => {
    try { const res = await API.get('/admin/classrooms'); setClassrooms(res.data); }
    catch (err) { console.error(err); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post('/admin/classrooms', { name, latitude: parseFloat(lat), longitude: parseFloat(lng), radiusMeters: parseInt(radius) || 50 });
      toast.success(`Classroom "${name}" added!`);
      setName(''); setLat(''); setLng(''); setRadius('50');
      setShowForm(false);
      fetchClassrooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, roomName) => {
    if (!confirm(`Delete "${roomName}"?`)) return;
    try {
      await API.delete(`/admin/classrooms/${id}`);
      toast.success(`"${roomName}" deleted`);
      setClassrooms(prev => prev.filter(c => c._id !== id));
    } catch (err) { toast.error('Failed to delete'); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    toast.loading('Getting your location...', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); toast.success('GPS coordinates captured!', { id: 'loc' }); },
      () => toast.error('Location access denied', { id: 'loc' }),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Classroom Locations</h1>
                <p className={`mt-2 text-sm sm:text-base ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                  Define GPS coordinates and allowed radius for each classroom.
                </p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(!showForm)}
                className={showForm ? 'btn-danger flex items-center gap-2 px-5 py-3' : 'btn-primary flex items-center gap-2 px-5 py-3'}
                id="add-classroom-btn">
                {showForm ? <><HiX /> Cancel</> : <><HiPlus /> Add Classroom</>}
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
                <div className="glass-card p-8">
                  <h3 className="font-semibold mb-5 text-xl">New Classroom</h3>
                  <form onSubmit={handleAdd} className="space-y-5">
                    <div>
                      <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Classroom Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g. Room 101, Lab A3" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Latitude</label>
                        <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} className="input-field" placeholder="e.g. 30.877164" required />
                      </div>
                      <div>
                        <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Longitude</label>
                        <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} className="input-field" placeholder="e.g. 76.871861" required />
                      </div>
                    </div>
                    <div>
                      <label className={`text-sm font-medium mb-2 block ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>Allowed Radius (meters)</label>
                      <input type="number" value={radius} onChange={e => setRadius(e.target.value)} className="input-field" placeholder="50" />
                      <p className={`text-xs mt-1.5 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>Students must be within this distance from the classroom center.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="button" onClick={useMyLocation} className="btn-secondary flex items-center justify-center gap-2">
                        <HiLocationMarker /> Use My Current GPS
                      </button>
                      <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2">
                        {saving ? 'Saving...' : 'Save Classroom'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {classrooms.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
                <HiLocationMarker className={`text-5xl mx-auto mb-3 ${t ? 'text-[#334155]' : 'text-[#cbd5e1]'}`} />
                <p className={`text-lg font-medium mb-1 ${t ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>No classrooms added yet</p>
                <p className={`text-sm mb-4 ${t ? 'text-[#475569]' : 'text-[#cbd5e1]'}`}>Click "Add Classroom" to define a GPS location.</p>
                {!showForm && <button onClick={() => setShowForm(true)} className="btn-primary"><HiPlus className="inline mr-1" /> Add Your First Classroom</button>}
              </motion.div>
            ) : classrooms.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#06b6d4]/15 flex items-center justify-center"><HiLocationMarker className="text-xl text-[#06b6d4]" /></div>
                  <div>
                    <h3 className="font-semibold text-base">{c.name}</h3>
                    <p className={`text-sm ${t ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      Lat: {c.latitude.toFixed(6)}, Lng: {c.longitude.toFixed(6)} — Radius: {c.radiusMeters}m
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(c._id, c.name)} className="btn-danger flex items-center gap-1"><HiTrash /> Delete</button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
