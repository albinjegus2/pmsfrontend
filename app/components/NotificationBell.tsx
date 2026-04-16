'use client';

import { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import { notificationAPI } from '../utils/api';

const TYPE_COLORS: Record<string, string> = {
  leave_approved: 'text-emerald-400',
  leave_rejected: 'text-red-400',
  leave_request: 'text-blue-400',
  permission_approved: 'text-emerald-400',
  permission_rejected: 'text-red-400',
  permission_request: 'text-blue-400',
  review_scheduled: 'text-yellow-400',
  review_completed: 'text-purple-400',
  feedback: 'text-pink-400',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const [nRes, cRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(nRes.data);
      setUnread(cRes.data.count);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) load();
  };

  const markRead = async (id: number) => {
    await notificationAPI.markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const markAll = async () => {
    await notificationAPI.markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, is_read: 1 })));
    setUnread(0);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
        <FiBell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
            style={{ background: 'linear-gradient(135deg, #F5C842, #D97706)', boxShadow: '0 0 8px rgba(245,200,66,.6)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-modal z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary-400 hover:text-primary-300">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">No notifications</p>
            ) : notifications.map(n => (
              <div key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-primary-500/5' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-primary-400' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${TYPE_COLORS[n.type] || 'text-white'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
