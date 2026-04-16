'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskAPI, clientAPI, orgAPI } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { FiPlus, FiMessageSquare, FiActivity, FiTrash2, FiX } from 'react-icons/fi';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('list');

  const [formData, setFormData] = useState({
    title: '', description: '', department: 'general',
    assigned_to: '', team_id: '', department_id: '',
    client_id: '', priority: 'medium', due_date: '',
    participant_ids: [] as number[], observer_ids: [] as number[],
  });

  const isLeadOrAdmin = ['admin', 'team_lead', 'marketing_head', 'crm_head'].includes(user?.role || '');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTasks();
    clientAPI.getAll().then(r => setClients(r.data)).catch(() => {});
    orgAPI.getTeams().then(r => setTeams(r.data)).catch(() => {});
    orgAPI.getDepartments().then(r => setDepartments(r.data)).catch(() => {});
    orgAPI.getMembers().then(r => setMembers(r.data)).catch(() => {});
  }, []);

  const loadTasks = async () => {
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (filterTeam) params.team_id = filterTeam;
    const res = await taskAPI.getAll(params);
    setTasks(res.data);
  };

  useEffect(() => { loadTasks(); }, [filterStatus, filterTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.due_date && formData.due_date < today) {
      alert('Due date cannot be in the past.');
      return;
    }
    try {
      await taskAPI.create(formData);
      setShowModal(false);
      setFormData({ title: '', description: '', department: 'general', assigned_to: '', team_id: '', department_id: '', client_id: '', priority: 'medium', due_date: '', participant_ids: [], observer_ids: [] });
      loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId: number, status: string) => {
    await taskAPI.update(taskId, { status });
    loadTasks();
  };

  const openTask = (task: any) => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    await taskAPI.delete(taskId);
    loadTasks();
  };

  const filteredMembers = formData.team_id
    ? members.filter(m => String(m.team_id) === formData.team_id || String(m.department_id) === formData.department_id)
    : members;

  const filteredDepts = formData.team_id
    ? departments.filter(d => String(d.team_id) === formData.team_id)
    : departments;

  // Assign To: filter by selected team if chosen, else all
  const assignableMembers = formData.team_id
    ? members.filter(m => String(m.team_id) === formData.team_id)
    : members;

  const statuses = ['pending', 'in_progress', 'review', 'completed'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tasks</h1>
        <div className="flex gap-3 items-center">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-2 text-sm">
            <option value="">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="input py-2 text-sm">
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 gap-1">
            {(['list', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-sm capitalize ${view === v ? 'bg-indigo-600 text-white' : ''}`}
              >{v}</button>
            ))}
          </div>
          {isLeadOrAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-gold flex items-center gap-2">
              <FiPlus /> New Task
            </button>
          )}
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {statuses.map(status => (
            <div key={status} className="bg-gray-100 dark:bg-gray-800/40 rounded-xl p-3 border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${status === 'pending' ? 'bg-gray-500' : status === 'in_progress' ? 'bg-blue-500' : status === 'review' ? 'bg-purple-500' : 'bg-green-500'}`} />
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">{status.replace('_', ' ')}</h3>
                <span className="text-[10px] text-gray-500 font-bold ml-auto">{tasks.filter(t => t.status === status).length}</span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} onClick={() => openTask(task)}
                    className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-white/5 cursor-pointer hover:border-indigo-500/30 transition-all shadow-sm">
                    <p className="font-bold text-sm mb-1 text-gray-900 dark:text-gray-100">{task.title}</p>
                    <p className="text-[10px] text-gray-500 mb-3">{task.team_name || task.department_name || '-'}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{task.due_date || 'No date'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/2 border-b border-gray-100 dark:border-white/5">
                {['Title', 'Assigned To', 'Team', 'Priority', 'Status', 'Due', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-white/2 cursor-pointer transition-colors" onClick={() => openTask(task)}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-xs text-gray-900 dark:text-gray-100">{task.title}</p>
                    <p className="text-[10px] text-gray-400">by {task.assigned_by_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">{task.assigned_name?.[0] || 'U'}</div>
                       <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{task.assigned_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-500">{task.team_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <select value={task.status}
                      onChange={e => updateStatus(task.id, e.target.value)}
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded border-0 cursor-pointer outline-none ${STATUS_COLORS[task.status]}`}
                    >
                      {statuses.map(s => <option key={s} value={s} className="bg-white text-darker">{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-gray-500 font-bold">{task.due_date || '-'}</td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    {user?.role === 'admin' && (
                      <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-xs font-bold">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Task Title *</label>
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all" required />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all h-24 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Team</label>
                  <select value={formData.team_id} onChange={e => setFormData({ ...formData, team_id: e.target.value, department_id: '', assigned_to: '' })} className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-xs font-bold">
                    <option value="">Select Team</option>
                    {teams.map(t => <option key={t.id} value={t.id} className="dark:bg-darker">{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Assign To</label>
                  <select value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-xs font-bold">
                    <option value="">Unassigned</option>
                    {assignableMembers.map(m => <option key={m.id} value={m.id} className="dark:bg-darker">{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-xs font-bold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Due Date</label>
                  <input type="date" value={formData.due_date} min={today} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl outline-none text-xs font-bold transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Participants</label>
                  <div className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent rounded-xl min-h-[48px]">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {formData.participant_ids.map(pid => {
                        const m = members.find(x => x.id === pid);
                        return m ? (
                          <span key={pid} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold">
                            {m.name}
                            <button type="button" onClick={() => setFormData({ ...formData, participant_ids: formData.participant_ids.filter(i => i !== pid) })} className="hover:text-red-500">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <select onChange={e => { const v = Number(e.target.value); if (v && !formData.participant_ids.includes(v)) setFormData({ ...formData, participant_ids: [...formData.participant_ids, v] }); e.target.value = ''; }} className="w-full bg-transparent outline-none text-xs font-bold text-gray-500 dark:text-gray-400">
                      <option value="">+ Add participant</option>
                      {members.filter(m => !formData.participant_ids.includes(m.id)).map(m => <option key={m.id} value={m.id} className="dark:bg-darker">{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Observers</label>
                  <div className="w-full px-4 py-3 bg-gray-100 dark:bg-white/5 border border-transparent rounded-xl min-h-[48px]">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {formData.observer_ids.map(oid => {
                        const m = members.find(x => x.id === oid);
                        return m ? (
                          <span key={oid} className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold">
                            {m.name}
                            <button type="button" onClick={() => setFormData({ ...formData, observer_ids: formData.observer_ids.filter(i => i !== oid) })} className="hover:text-red-500">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <select onChange={e => { const v = Number(e.target.value); if (v && !formData.observer_ids.includes(v)) setFormData({ ...formData, observer_ids: [...formData.observer_ids, v] }); e.target.value = ''; }} className="w-full bg-transparent outline-none text-xs font-bold text-gray-500 dark:text-gray-400">
                      <option value="">+ Add observer</option>
                      {members.filter(m => !formData.observer_ids.includes(m.id)).map(m => <option key={m.id} value={m.id} className="dark:bg-darker">{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Create Task</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
