'use client';

import { useEffect, useState, useRef } from 'react';
import { activityAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { FiRefreshCw, FiActivity, FiUsers, FiClock, FiZap } from 'react-icons/fi';

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active:  { label: 'Active',   dot: 'bg-green-400 animate-pulse',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  online:  { label: 'Online',   dot: 'bg-blue-400',                  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  idle:    { label: 'Idle',     dot: 'bg-yellow-400 animate-pulse',  badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  away:    { label: 'Away',     dot: 'bg-orange-400',                badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  offline: { label: 'Offline',  dot: 'bg-gray-400',                  badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

function fmtSeconds(sec: number) {
  if (!sec) return '0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? 'bg-green-500' :
    score >= 70 ? 'bg-blue-500'  :
    score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`}
             style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold w-10 text-right">{score?.toFixed(0) ?? 0}%</span>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [filter, setFilter]       = useState<'all' | 'active' | 'idle' | 'offline'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<any>(null);

  const load = async () => {
    try {
      const res = await activityAPI.getLive();
      setEmployees(res.data);
      setLastRefresh(new Date());
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  const filtered = filter === 'all'
    ? employees
    : employees.filter(e => e.status === filter);

  const activeCount  = employees.filter(e => e.status === 'active').length;
  const idleCount    = employees.filter(e => e.status === 'idle' || e.status === 'away').length;
  const offlineCount = employees.filter(e => e.status === 'offline').length;
  const avgScore     = employees.length
    ? employees.reduce((s, e) => s + (e.productivity_score || 0), 0) / employees.length
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FiActivity className="text-primary-500" /> Live Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded" />
            Auto-refresh (30s)
          </label>
          <button onClick={load} className="btn-secondary gap-2 text-sm">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FiZap />}      label="Active Now"   value={activeCount}          color="bg-green-500"  sub="Working" />
        <StatCard icon={<FiClock />}    label="Idle / Away"  value={idleCount}            color="bg-yellow-500" sub="No activity" />
        <StatCard icon={<FiUsers />}    label="Offline"      value={offlineCount}         color="bg-gray-500"   sub="Not logged in" />
        <StatCard icon={<FiActivity />} label="Avg Score"    value={`${avgScore.toFixed(0)}%`} color="bg-blue-500" sub="Productivity" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mb-6">
        {(['all', 'active', 'idle', 'offline'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              filter === f
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {f === 'all' ? `All (${employees.length})` :
             f === 'active' ? `Active (${activeCount})` :
             f === 'idle'   ? `Idle (${idleCount})` :
             `Offline (${offlineCount})`}
          </button>
        ))}
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 card text-center py-12 text-gray-400">
            No employees found
          </div>
        )}
        {filtered.map((emp: any) => {
          const cfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.offline;
          const totalSec = (emp.today_active_seconds || 0) + (emp.today_idle_seconds || 0);
          return (
            <div key={emp.id} className="card hover:shadow-card-hover transition-all duration-200">
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500
                                    flex items-center justify-center text-white font-bold text-sm">
                      {emp.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2
                                      border-white dark:border-gray-800 ${cfg.dot}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{emp.role?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Team / dept */}
              {(emp.team_name || emp.department_name) && (
                <p className="text-xs text-gray-400 mb-3">
                  {emp.team_name}{emp.team_name && emp.department_name ? ' · ' : ''}{emp.department_name}
                </p>
              )}

              {/* Productivity score */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Productivity</span>
                  <span>{fmtSeconds(emp.today_active_seconds || 0)} active</span>
                </div>
                <ScoreBar score={emp.productivity_score || 0} />
              </div>

              {/* Active vs Idle bar */}
              {totalSec > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="text-green-600">Active: {fmtSeconds(emp.today_active_seconds || 0)}</span>
                    <span className="text-yellow-600">Idle: {fmtSeconds(emp.today_idle_seconds || 0)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    <div className="bg-green-500 h-full transition-all duration-500"
                         style={{ width: `${(emp.today_active_seconds / totalSec) * 100}%` }} />
                    <div className="bg-yellow-400 h-full transition-all duration-500"
                         style={{ width: `${(emp.today_idle_seconds / totalSec) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Last active */}
              <p className="text-xs text-gray-400">
                {emp.status === 'offline'
                  ? emp.check_in_time ? '✓ Checked in today' : 'Not checked in today'
                  : emp.last_active
                  ? `Last active: ${new Date(emp.last_active).toLocaleTimeString()}`
                  : 'No activity recorded'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
