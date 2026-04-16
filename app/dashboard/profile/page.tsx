'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { authAPI, rewardsAPI } from '../../utils/api';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiShield, FiBriefcase, FiAward, FiClock, FiActivity } from 'react-icons/fi';
import GlowCard from '../../components/GlowCard';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rewards, setRewards] = useState<any>({ total_coins: 0, history: [] });
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || ''
      });
      loadRewards();
    }
  }, [user]);

  const loadRewards = async () => {
    try {
      const res = await rewardsAPI.getStats();
      setRewards(res.data);
    } catch (err) {}
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.updateProfile(profileForm);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-black text-shimmer uppercase tracking-tighter">My Profile</h1>
           <p className="text-gray-500 text-sm">Manage your personal information, rewards and security settings.</p>
        </div>
        {saved && (
           <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold border border-emerald-500/20 animate-bounce">
              ✓ Changes saved successfully
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Profile Card + Reward Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-black/5 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                 {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold dark:text-white capitalize">{user?.name}</h2>
              <p className="text-xs font-black uppercase text-indigo-500 tracking-widest mt-1">{user?.role?.replace('_', ' ')}</p>
              
              <div className="w-full mt-8 py-4 px-6 bg-slate-50 dark:bg-white/5 rounded-2xl flex flex-col gap-4 text-left">
                 <div className="flex items-center gap-3">
                    <FiMail className="text-gray-400" />
                    <div className="min-w-0">
                       <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
                       <p className="text-xs truncate dark:text-gray-300">{user?.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <FiBriefcase className="text-gray-400" />
                    <div className="min-w-0">
                       <p className="text-[10px] uppercase font-bold text-gray-400">Department</p>
                       <p className="text-xs truncate dark:text-gray-300">{user?.department_name || 'Unassigned'}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* PREMIUM GOLD COIN REWARD CARD */}
           <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-[32px] p-6 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden group border border-white/20">
               <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 group-hover:scale-125 transition-all duration-700">
                  <FiAward size={80}/>
               </div>
               <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Achievement Points</span>
                  <div className="flex items-end gap-2 mt-4">
                      <h2 className="text-5xl font-black">{rewards.total_coins}</h2>
                      <span className="text-xs font-bold pb-2 uppercase tracking-widest opacity-80 underline underline-offset-4 decoration-amber-200">Coins</span>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/20 space-y-3">
                      <p className="text-[11px] font-bold leading-tight opacity-90 italic">"Excellence is not an act, but a habit."</p>
                      <div className="flex items-center gap-2 px-3 py-2 bg-black/10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                         <FiActivity size={12}/> {rewards.history?.length || 0} RECENT ACHIEVEMENTS
                      </div>
                  </div>
               </div>
           </div>
        </div>

        {/* Right Column: Edit Forms + Reward History */}
        <div className="lg:col-span-3 space-y-8">
           
           {/* Reward History Table */}
           <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-black/5 overflow-hidden">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                 <span className="flex items-center gap-2"><FiAward className="text-amber-500" /> Recent Appreciations</span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auto-Updating</span>
              </h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          <th className="pb-4 truncate">Reason for Appreciation</th>
                          <th className="pb-4 text-center">Reward</th>
                          <th className="pb-4 text-right">Date</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                       {rewards.history.map((row: any, i: number) => (
                          <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                             <td className="py-4 text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:pl-2 transition-all">{row.reason}</td>
                             <td className="py-4 text-center">
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[11px] font-black">+{row.amount}</span>
                             </td>
                             <td className="py-4 text-right text-[10px] font-black text-gray-400 text-nowrap">
                                {new Date(row.created_at).toLocaleDateString()}
                             </td>
                          </tr>
                       ))}
                       {rewards.history.length === 0 && (
                          <tr><td colSpan={3} className="py-8 text-center text-sm text-gray-400 italic font-medium">No achievement coins earned yet. Start completing tasks on time!</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Edit General Info */}
           <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-xl shadow-black/5">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <FiUser className="text-indigo-500" /> Account Settings
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Full Display Name</label>
                       <input 
                          type="text" 
                          value={profileForm.name} 
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Contact Number</label>
                       <input 
                          type="text" 
                          value={profileForm.phone} 
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                       />
                    </div>
                 </div>
                 <button type="submit" disabled={loading} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <FiSave /> Securely Update Profile
                 </button>
              </form>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .text-shimmer {
          background: linear-gradient(90deg, #6366f1, #a855f7, #6366f1);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 5s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
