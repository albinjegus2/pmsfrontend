'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { announcementAPI } from '../../utils/api';
import { FiPlus, FiTrash2, FiEdit2, FiMessageCircle, FiSend, FiSmile, FiX, FiInfo, FiClock, FiUser, FiCheck, FiBell, FiMessageSquare } from 'react-icons/fi';

const COMMON_EMOJIS = ['😊', '😂', '👍', '🔥', '❤️', '🙌', '🎉', '💻', '🚀', '✅', '✨', '📢', '💡', '💯', '🌟', '🙏', '👏', '🤝', '🎈', '❤️‍🔥'];

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const canManage = ['admin', 'marketing_head', 'team_lead'].includes(user?.role || '');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementAPI.getAll();
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (id: number) => {
    if (expandedId === id) {
       setExpandedId(null);
       return;
    }
    try {
      const res = await announcementAPI.getComments(id);
      setComments({ ...comments, [id]: res.data });
      setExpandedId(id);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await announcementAPI.update(editingId, form);
        showToast('Announcement updated successfully!');
      } else {
        await announcementAPI.create(form);
        showToast('Announcement posted & employees notified!');
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ title: '', content: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to save', err);
      showToast('Failed to post announcement', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementAPI.delete(id);
      fetchAnnouncements();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddComment = async (annId: number) => {
    if (!newComment.trim()) return;
    try {
      await announcementAPI.addComment(annId, newComment);
      const res = await announcementAPI.getComments(annId);
      setComments({ ...comments, [annId]: res.data });
      setNewComment('');
      setShowEmojiPicker(null);
    } catch (err) {
      console.error('Comment failed', err);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Announcements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 pt-4 px-4">
      {/* Small Neat Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-500/10 dark:bg-gold-500/10 border border-primary-500/20 dark:border-gold-500/20 rounded-xl flex items-center justify-center text-primary-500 dark:text-gold-500">
             <FiBell size={20} />
          </div>
          <div>
             <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1">Announcements</h1>
             <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Latest organization updates</p>
          </div>
        </div>
        {canManage && (
           <button 
              onClick={() => { setEditingId(null); setForm({ title: '', content: '' }); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-darker rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 dark:shadow-gold-500/10 transition-all active:scale-95"
           >
              <FiPlus /> New Notification
           </button>
        )}
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center py-20">
             <FiInfo size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No active announcements</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
              
              <div className="flex justify-between items-start gap-4 mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-bold uppercase border border-gray-200 dark:border-white/5">
                       {ann.sender_name?.[0] || 'A'}
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">{ann.sender_name}</h3>
                       <p className="text-[10px] text-gray-400 font-medium">{formatDate(ann.created_at)}</p>
                    </div>
                 </div>
                 {canManage && (
                    <div className="flex gap-1">
                       <button onClick={() => { setEditingId(ann.id); setForm({ title: ann.title, content: ann.content }); setShowModal(true); }} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/5 rounded-lg transition-all"><FiEdit2 size={16} /></button>
                       <button onClick={() => handleDelete(ann.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"><FiTrash2 size={16} /></button>
                    </div>
                 )}
              </div>

              <div className="space-y-2 mb-6">
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{ann.title}</h2>
                 <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                 <button 
                    onClick={() => loadComments(ann.id)} 
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all ${expandedId === ann.id ? 'text-primary-500 bg-primary-500/5' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                    <FiMessageCircle size={16} />
                    <span>{ann.comment_count || 0} Comments</span>
                 </button>
                 <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500`}>{ann.sender_role?.replace('_', ' ')}</span>
              </div>

              {expandedId === ann.id && (
                <div className="mt-4 space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                   <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-2">
                      {comments[ann.id]?.map(c => (
                        <div key={c.id} className="flex gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/5 flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-gray-500">
                              {c.user_name?.[0]}
                           </div>
                           <div className="bg-slate-50 dark:bg-white/3 p-3 rounded-xl rounded-tl-none flex-1">
                              <p className="text-[10px] font-bold dark:text-white mb-1">{c.user_name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{c.content}</p>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="relative mt-4">
                      <input 
                         type="text" 
                         placeholder="Add a comment..." 
                         value={newComment}
                         onChange={e => setNewComment(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleAddComment(ann.id)}
                         className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/10 dark:text-white"
                      />
                      <button 
                        onClick={() => handleAddComment(ann.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-500 transition-colors"
                      >
                         <FiSend size={16} />
                      </button>
                   </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5">
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                 <h2 className="text-lg font-bold dark:text-white">{editingId ? 'Edit Post' : 'New Post'}</h2>
                 <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><FiX size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-6">
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Headline</label>
                    <input 
                       type="text" 
                       required 
                       value={form.title}
                       onChange={e => setForm({ ...form, title: e.target.value })}
                       className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Content</label>
                    <textarea 
                       required 
                       value={form.content}
                       onChange={e => setForm({ ...form, content: e.target.value })}
                       className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm h-40 outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white resize-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-darker rounded-xl font-bold shadow-lg transition-all active:scale-95">
                    {editingId ? 'Update Announcement' : 'Post Announcement'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold transition-all animate-fade-in ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
