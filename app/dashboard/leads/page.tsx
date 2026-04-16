'use client';

import { useEffect, useState } from 'react';
import { leadsAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import {
  FiPlus, FiSearch, FiChevronDown, FiChevronUp,
  FiTrash2, FiEdit2, FiUserCheck, FiMessageSquare,
  FiPhone, FiMail, FiUser, FiTrendingUp,
} from 'react-icons/fi';

const STATUSES = ['new', 'contacted', 'follow_up', 'negotiation', 'converted', 'lost'] as const;
type LeadStatus = typeof STATUSES[number];

const STATUS_STYLE: Record<LeadStatus, string> = {
  new:         'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  contacted:   'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',
  follow_up:   'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  negotiation: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400',
  converted:   'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  lost:        'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
};

const SOURCES = ['website', 'referral', 'social_media', 'cold_call', 'email_campaign', 'other'];
const SOURCE_LABEL: Record<string, string> = {
  website: 'Website', referral: 'Referral', social_media: 'Social Media',
  cold_call: 'Cold Call', email_campaign: 'Email Campaign', other: 'Other',
};

const EMPTY_FORM = {
  name: '', company: '', phone: '', email: '',
  source: 'other', service_interest: '', notes: '', assigned_to: '',
};

const EMPTY_CONVERT = {
  total_amount: '', initial_payment: '', payment_date: '',
  payment_method: 'bank_transfer', package_purchased: '',
  project_start_date: '', deadline: '', reference: '',
};

export default function LeadsPage() {
  const { user } = useAuth();
  const canDelete  = user?.role === 'admin' || user?.role === 'marketing_head';
  const canConvert = user?.role === 'admin' || user?.role === 'crm_head' || user?.role === 'marketing_head';

  const [leads, setLeads]           = useState<any[]>([]);
  const [stats, setStats]           = useState<any>({});
  const [users, setUsers]           = useState<any[]>([]);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // modals
  const [showAdd, setShowAdd]           = useState(false);
  const [editLead, setEditLead]         = useState<any>(null);
  const [followupLead, setFollowupLead] = useState<any>(null);
  const [convertLead, setConvertLead]   = useState<any>(null);

  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [followupNote, setFollowupNote]   = useState('');
  const [followupDate, setFollowupDate]   = useState('');
  const [convertForm, setConvertForm]     = useState({ ...EMPTY_CONVERT });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { load(); loadUsers(); }, []);

  const load = async () => {
    try {
      const [s, l] = await Promise.all([leadsAPI.getStats(), leadsAPI.getAll()]);
      setStats(s.data);
      setLeads(l.data);
    } catch { /* ignore */ }
  };

  const loadUsers = async () => {
    try {
      const [crm_heads, mheads] = await Promise.all([
        authAPI.getUsers({ role: 'crm_head' }),
        authAPI.getUsers({ role: 'marketing_head' }),
      ]);
      setUsers([...crm_heads.data, ...mheads.data]);
    } catch { /* ignore */ }
  };

  const filtered = leads.filter(l => {
    const matchStatus = filterStatus ? l.status === filterStatus : true;
    const q = search.toLowerCase();
    const matchSearch = !q || l.name?.toLowerCase().includes(q) ||
      l.company?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const toggleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
  };

  // ── Add / Edit ──────────────────────────────────────────────
  const openEdit = (lead: any) => {
    setForm({
      name: lead.name, company: lead.company || '', phone: lead.phone || '',
      email: lead.email || '', source: lead.source || 'other',
      service_interest: lead.service_interest || '', notes: lead.notes || '',
      assigned_to: lead.assigned_to || '',
    });
    setEditLead(lead);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null };
      if (editLead) {
        await leadsAPI.update(editLead.id, payload);
        setEditLead(null);
      } else {
        await leadsAPI.create(payload);
        setShowAdd(false);
      }
      setForm({ ...EMPTY_FORM });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  // ── Status quick-change ──────────────────────────────────────
  const changeStatus = async (lead: any, status: string) => {
    if (status === 'converted') return; // must use convert flow
    await leadsAPI.update(lead.id, { status });
    load();
  };

  // ── Follow-up ────────────────────────────────────────────────
  const handleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupLead) return;
    setSaving(true);
    try {
      await leadsAPI.addFollowup(followupLead.id, { note: followupNote, next_followup_date: followupDate || null });
      setFollowupLead(null);
      setFollowupNote(''); setFollowupDate('');
      // refresh expanded followups
      const res = await leadsAPI.getById(followupLead.id);
      setLeads(prev => prev.map(l => l.id === followupLead.id ? { ...l, followups: res.data.followups } : l));
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  // ── Convert ──────────────────────────────────────────────────
  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLead) return;
    if (!convertForm.total_amount || parseFloat(convertForm.total_amount) <= 0) {
      alert('Total contract amount is required to convert lead to client.');
      return;
    }
    setSaving(true);
    try {
      await leadsAPI.convert(convertLead.id, {
        ...convertForm,
        total_amount: parseFloat(convertForm.total_amount),
        initial_payment: convertForm.initial_payment ? parseFloat(convertForm.initial_payment) : 0,
      });
      setConvertLead(null);
      setConvertForm({ ...EMPTY_CONVERT });
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this lead?')) return;
    await leadsAPI.delete(id);
    load();
  };

  const STAT_CARDS = [
    { label: 'Total Leads',  value: stats.total          ?? 0, cls: 'text-blue-500' },
    { label: 'New',          value: stats.new_count       ?? 0, cls: 'text-blue-400' },
    { label: 'Follow Up',    value: stats.follow_up_count ?? 0, cls: 'text-yellow-500' },
    { label: 'Negotiation',  value: stats.negotiation_count ?? 0, cls: 'text-orange-500' },
    { label: 'Converted',    value: stats.converted_count ?? 0, cls: 'text-emerald-500' },
    { label: 'Lost',         value: stats.lost_count      ?? 0, cls: 'text-red-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track prospects and convert them to clients</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setError(''); setShowAdd(true); }} className="btn-primary gap-2">
          <FiPlus size={16} /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(({ label, value, cls }) => (
          <div key={label} className="card p-4 text-center cursor-pointer hover:ring-1 hover:ring-primary-500/30 transition-all"
            onClick={() => setFilterStatus(label === 'Total Leads' ? '' : label.toLowerCase().replace(' ', '_'))}>
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Search leads..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select className="input w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        {filterStatus && (
          <button onClick={() => setFilterStatus('')} className="btn-secondary text-xs px-3">Clear</button>
        )}
      </div>

      {/* Lead List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-gray-400">No leads found.</div>
        )}
        {filtered.map(lead => (
          <div key={lead.id} className="card p-0 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{lead.name}</h3>
                    {lead.company && <span className="text-xs text-gray-500">@ {lead.company}</span>}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLE[lead.status as LeadStatus]}`}>
                      {lead.status.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                    {lead.status === 'converted' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium flex items-center gap-1">
                        <FiUserCheck size={11} /> Client
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {lead.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><FiPhone size={11} />{lead.phone}</span>}
                    {lead.email && <span className="text-xs text-gray-400 flex items-center gap-1"><FiMail size={11} />{lead.email}</span>}
                    {lead.assigned_to_name && <span className="text-xs text-gray-400 flex items-center gap-1"><FiUser size={11} />{lead.assigned_to_name}</span>}
                    {lead.service_interest && <span className="text-xs text-gray-400 flex items-center gap-1"><FiTrendingUp size={11} />{lead.service_interest}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">{SOURCE_LABEL[lead.source] || lead.source}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {lead.status !== 'converted' && lead.status !== 'lost' && (
                    <>
                      {/* Status quick change */}
                      <select
                        value={lead.status}
                        onChange={e => changeStatus(lead, e.target.value)}
                        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 focus:outline-none">
                        {STATUSES.filter(s => s !== 'converted').map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>

                      <button onClick={() => setFollowupLead(lead)}
                        className="p-2 rounded-xl text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all" title="Add Follow-up">
                        <FiMessageSquare size={15} />
                      </button>

                      {canConvert && (
                        <button onClick={() => { setConvertForm({ ...EMPTY_CONVERT, package_purchased: lead.service_interest || '' }); setConvertLead(lead); }}
                          className="btn-primary gap-1.5 text-xs py-1.5 px-3">
                          <FiUserCheck size={13} /> Convert
                        </button>
                      )}
                    </>
                  )}

                  <button onClick={() => openEdit(lead)}
                    className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                    <FiEdit2 size={15} />
                  </button>

                  {canDelete && (
                    <button onClick={() => handleDelete(lead.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                      <FiTrash2 size={15} />
                    </button>
                  )}

                  <button onClick={() => toggleExpand(lead.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                    {expandedId === lead.id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {lead.notes && (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                  📝 {lead.notes}
                </p>
              )}
            </div>

            {/* Expanded: Follow-up history */}
            {expandedId === lead.id && (
              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/2 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Log</h4>
                  {lead.status !== 'converted' && lead.status !== 'lost' && (
                    <button onClick={() => setFollowupLead(lead)}
                      className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                      <FiPlus size={12} /> Add Note
                    </button>
                  )}
                </div>
                {!lead.followups || lead.followups.length === 0 ? (
                  <p className="text-sm text-gray-400">No contact notes yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(lead.followups || []).map((f: any) => (
                      <div key={f.id} className="p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{f.note}</p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">by {f.added_by_name || '—'}</span>
                          {f.next_followup_date && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                              📅 Next: {new Date(f.next_followup_date).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Lead Modal */}
      {(showAdd || editLead) && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditLead(null); }}>
          <div className="modal-box w-full max-w-2xl mx-4 p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editLead ? `Edit — ${editLead.name}` : 'Add New Lead'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                  <input type="text" required className="input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Company</label>
                  <input type="text" className="input" value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                  <input type="text" className="input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input type="email" className="input" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Service Interest</label>
                  <input type="text" className="input" value={form.service_interest}
                    onChange={e => setForm(f => ({ ...f, service_interest: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source</label>
                  <select className="input" value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assign To</label>
                <select className="input" value={form.assigned_to}
                  onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role === 'marketing_head' ? 'Marketing Head' : u.role === 'crm_head' ? 'CRM Head' : 'CRM'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                <textarea className="input h-20 resize-none" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setEditLead(null); setError(''); }} className="btn-secondary flex-1">Cancel</button>
              </div>
              {error && <p className="text-xs text-red-500 text-center pt-1">{error}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {followupLead && (
        <div className="modal-overlay" onClick={() => setFollowupLead(null)}>
          <div className="modal-box w-full max-w-md mx-4 p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Add Follow-up Note</h2>
            <p className="text-sm text-gray-500 mb-6">{followupLead.name} {followupLead.company ? `· ${followupLead.company}` : ''}</p>
            <form onSubmit={handleFollowup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note *</label>
                <textarea required className="input h-24 resize-none" placeholder="What happened in this contact?"
                  value={followupNote} onChange={e => setFollowupNote(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Next Follow-up Date</label>
                <input type="date" className="input" value={followupDate} onChange={e => setFollowupDate(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Note'}</button>
                <button type="button" onClick={() => setFollowupLead(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Client Modal */}
      {convertLead && (
        <div className="modal-overlay" onClick={() => setConvertLead(null)}>
          <div className="modal-box w-full max-w-lg mx-4 p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Convert to Client</h2>
            <p className="text-sm text-gray-500 mb-2">{convertLead.name} {convertLead.company ? `· ${convertLead.company}` : ''}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-6 flex items-center gap-1.5">
              ⚠️ Total contract amount is required. Initial payment confirms the conversion.
            </p>
            <form onSubmit={handleConvert} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Total Contract Amount (₹) *</label>
                  <input type="number" required min="1" step="0.01" className="input"
                    value={convertForm.total_amount} onChange={e => setConvertForm({ ...convertForm, total_amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Initial Payment (₹)</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="Optional"
                    value={convertForm.initial_payment} onChange={e => setConvertForm({ ...convertForm, initial_payment: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment Date</label>
                  <input type="date" className="input"
                    value={convertForm.payment_date} onChange={e => setConvertForm({ ...convertForm, payment_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
                  <select className="input" value={convertForm.payment_method}
                    onChange={e => setConvertForm({ ...convertForm, payment_method: e.target.value })}>
                    {[['cash','Cash'],['bank_transfer','Bank Transfer'],['cheque','Cheque'],['upi','UPI'],['card','Card'],['other','Other']]
                      .map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Package / Service</label>
                  <input type="text" className="input"
                    value={convertForm.package_purchased} onChange={e => setConvertForm({ ...convertForm, package_purchased: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project Start Date</label>
                  <input type="date" className="input"
                    value={convertForm.project_start_date} onChange={e => setConvertForm({ ...convertForm, project_start_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deadline</label>
                  <input type="date" className="input"
                    value={convertForm.deadline} onChange={e => setConvertForm({ ...convertForm, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Payment Reference</label>
                  <input type="text" className="input" placeholder="Optional"
                    value={convertForm.reference} onChange={e => setConvertForm({ ...convertForm, reference: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Converting...' : '✓ Convert to Client'}
                </button>
                <button type="button" onClick={() => setConvertLead(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
