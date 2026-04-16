'use client';

import { useState } from 'react';
import { proposalAPI } from '../utils/api';
import { FiX, FiCheck, FiChevronRight, FiChevronLeft, FiPlus, FiTrash2, FiSend } from 'react-icons/fi';

/* ── 10 pre-built templates ─────────────────────────────── */
const TEMPLATES = [
  {
    id: 'web-basic',
    category: 'Web Development',
    name: 'Basic Website Package',
    description: '5-page responsive website with CMS',
    timeline: '4–6 weeks',
    items: [
      { description: 'UI/UX Design (5 pages)', quantity: 1, unit_price: 25000 },
      { description: 'Frontend Development', quantity: 1, unit_price: 35000 },
      { description: 'CMS Integration', quantity: 1, unit_price: 15000 },
      { description: 'Hosting Setup & Go-Live', quantity: 1, unit_price: 8000 },
    ],
  },
  {
    id: 'web-ecommerce',
    category: 'Web Development',
    name: 'E-Commerce Store',
    description: 'Full e-commerce with payment gateway',
    timeline: '8–12 weeks',
    items: [
      { description: 'E-Commerce UI/UX Design', quantity: 1, unit_price: 45000 },
      { description: 'Frontend + Backend Development', quantity: 1, unit_price: 90000 },
      { description: 'Payment Gateway Integration', quantity: 1, unit_price: 20000 },
      { description: 'Product Catalog Setup (up to 100)', quantity: 1, unit_price: 15000 },
      { description: 'Testing & QA', quantity: 1, unit_price: 12000 },
    ],
  },
  {
    id: 'dm-social',
    category: 'Digital Marketing',
    name: 'Social Media Management',
    description: 'Monthly social media management across 3 platforms',
    timeline: 'Monthly retainer',
    items: [
      { description: 'Content Creation (12 posts/month)', quantity: 1, unit_price: 18000 },
      { description: 'Platform Management (3 platforms)', quantity: 1, unit_price: 12000 },
      { description: 'Monthly Analytics Report', quantity: 1, unit_price: 5000 },
      { description: 'Paid Ad Management', quantity: 1, unit_price: 10000 },
    ],
  },
  {
    id: 'dm-ppc',
    category: 'Digital Marketing',
    name: 'PPC Advertising Campaign',
    description: 'Google & Meta ads setup and management',
    timeline: '3-month campaign',
    items: [
      { description: 'Campaign Strategy & Setup', quantity: 1, unit_price: 20000 },
      { description: 'Google Ads Management (monthly)', quantity: 3, unit_price: 12000 },
      { description: 'Meta Ads Management (monthly)', quantity: 3, unit_price: 10000 },
      { description: 'Performance Reporting', quantity: 3, unit_price: 4000 },
    ],
  },
  {
    id: 'design-brand',
    category: 'Design & Branding',
    name: 'Brand Identity Package',
    description: 'Logo, brand guidelines, and collateral',
    timeline: '3–4 weeks',
    items: [
      { description: 'Logo Design (3 concepts)', quantity: 1, unit_price: 18000 },
      { description: 'Brand Guidelines Document', quantity: 1, unit_price: 12000 },
      { description: 'Business Card Design', quantity: 1, unit_price: 4000 },
      { description: 'Letterhead & Email Signature', quantity: 1, unit_price: 5000 },
      { description: 'Social Media Kit', quantity: 1, unit_price: 8000 },
    ],
  },
  {
    id: 'design-ui',
    category: 'Design & Branding',
    name: 'UI/UX Design Sprint',
    description: 'Full product UI/UX design with prototypes',
    timeline: '6–8 weeks',
    items: [
      { description: 'User Research & Wireframes', quantity: 1, unit_price: 28000 },
      { description: 'High-Fidelity UI Design', quantity: 1, unit_price: 55000 },
      { description: 'Interactive Prototype', quantity: 1, unit_price: 22000 },
      { description: 'Design Handoff (Figma)', quantity: 1, unit_price: 8000 },
    ],
  },
  {
    id: 'seo-basic',
    category: 'SEO & Content',
    name: 'SEO Starter Package',
    description: 'On-page SEO + keyword strategy',
    timeline: '2–3 months',
    items: [
      { description: 'SEO Audit & Strategy', quantity: 1, unit_price: 15000 },
      { description: 'On-Page Optimization (10 pages)', quantity: 1, unit_price: 20000 },
      { description: 'Keyword Research Report', quantity: 1, unit_price: 8000 },
      { description: 'Monthly SEO Report', quantity: 2, unit_price: 5000 },
    ],
  },
  {
    id: 'seo-content',
    category: 'SEO & Content',
    name: 'Content Marketing Package',
    description: 'Blog content + SEO + distribution',
    timeline: 'Monthly retainer',
    items: [
      { description: 'Blog Articles (4/month, 1000 words)', quantity: 4, unit_price: 4000 },
      { description: 'SEO Optimization per Article', quantity: 4, unit_price: 1500 },
      { description: 'Content Distribution & Promotion', quantity: 1, unit_price: 8000 },
      { description: 'Monthly Performance Report', quantity: 1, unit_price: 4000 },
    ],
  },
  {
    id: 'it-audit',
    category: 'IT Consulting',
    name: 'IT Infrastructure Audit',
    description: 'Full IT audit with recommendations report',
    timeline: '2–3 weeks',
    items: [
      { description: 'Infrastructure Assessment', quantity: 1, unit_price: 35000 },
      { description: 'Security Vulnerability Scan', quantity: 1, unit_price: 22000 },
      { description: 'Recommendations Report', quantity: 1, unit_price: 12000 },
      { description: 'Executive Presentation', quantity: 1, unit_price: 8000 },
    ],
  },
  {
    id: 'it-cloud',
    category: 'IT Consulting',
    name: 'Cloud Migration Consulting',
    description: 'Cloud strategy, migration plan & execution support',
    timeline: '6–10 weeks',
    items: [
      { description: 'Cloud Readiness Assessment', quantity: 1, unit_price: 40000 },
      { description: 'Migration Strategy & Roadmap', quantity: 1, unit_price: 55000 },
      { description: 'Migration Execution Support (hours)', quantity: 20, unit_price: 4000 },
      { description: 'Post-Migration Testing', quantity: 1, unit_price: 20000 },
    ],
  },
];

const CATEGORIES = ['Web Development', 'Digital Marketing', 'Design & Branding', 'SEO & Content', 'IT Consulting'];

const CAT_COLORS: Record<string, string> = {
  'Web Development':   'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  'Digital Marketing': 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
  'Design & Branding': 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/30',
  'SEO & Content':     'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
  'IT Consulting':     'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
};

interface LineItem { description: string; quantity: number; unit_price: number; total: number; }

interface Props {
  client: { id: number; company_name: string; contact_person: string; email: string; };
  onClose: () => void;
  onSent: () => void;
}

export default function SendProposalModal({ client, onClose, onSent }: Props) {
  const [step, setStep]               = useState(1);
  const [catFilter, setCatFilter]     = useState('All');
  const [selected, setSelected]       = useState<typeof TEMPLATES[0] | null>(null);
  const [items, setItems]             = useState<LineItem[]>([]);
  const [taxPct, setTaxPct]           = useState(0);
  const [note, setNote]               = useState('');
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState('');

  const selectTemplate = (t: typeof TEMPLATES[0]) => {
    setSelected(t);
    setItems(t.items.map(i => ({ ...i, total: i.quantity * i.unit_price })));
  };

  const updateItem = (idx: number, field: keyof LineItem, val: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: field === 'description' ? val : parseFloat(val) || 0 };
      updated.total = updated.quantity * updated.unit_price;
      return updated;
    }));
  };

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal    = items.reduce((s, i) => s + i.total, 0);
  const taxAmount   = subtotal * (taxPct / 100);
  const grandTotal  = subtotal + taxAmount;

  const handleSend = async () => {
    if (!selected) return;
    setSending(true); setError('');
    try {
      await proposalAPI.send({
        client_id:    client.id,
        template_id:  selected.id,
        template_name: selected.name,
        line_items:   items,
        subtotal,
        tax_percent:  taxPct,
        tax_amount:   taxAmount,
        total_amount: grandTotal,
        note:         note || null,
      });
      onSent();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to send proposal');
    } finally {
      setSending(false);
    }
  };

  const filtered = catFilter === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === catFilter);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send Proposal</h2>
            <p className="text-sm text-gray-500 mt-0.5">To: <span className="font-medium text-gray-700 dark:text-gray-300">{client.company_name}</span> · {client.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            <FiX size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-5">
          {['Choose Template', 'Review Invoice', 'Add Note & Send'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step > i + 1 ? 'bg-emerald-500 text-white' :
                step === i + 1 ? 'bg-primary-500 text-white' :
                'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}>
                {step > i + 1 ? <FiCheck size={12} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Choose Template ── */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {['All', ...CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    catFilter === cat
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary-300'
                  }`}>{cat}</button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {filtered.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selected?.id === t.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                      : 'border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-500/40 bg-white dark:bg-surface-dark'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAT_COLORS[t.category]}`}>
                      {t.category}
                    </span>
                    {selected?.id === t.id && (
                      <span className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <FiCheck size={11} className="text-white" />
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mt-2">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-1">⏱ {t.timeline}</p>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-2">
                    Est. ₹{t.items.reduce((s, i) => s + i.quantity * i.unit_price, 0).toLocaleString('en-IN')}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={!selected} onClick={() => setStep(2)} className="btn-primary gap-2">
                Next <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review Invoice ── */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{selected?.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAT_COLORS[selected?.category || '']}`}>
                {selected?.category}
              </span>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-2 text-xs text-gray-500 uppercase tracking-wider">Service / Description</th>
                    <th className="text-center py-2 text-xs text-gray-500 uppercase tracking-wider w-16">Qty</th>
                    <th className="text-right py-2 text-xs text-gray-500 uppercase tracking-wider w-28">Unit Price</th>
                    <th className="text-right py-2 text-xs text-gray-500 uppercase tracking-wider w-28">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-3">
                        <input className="input py-1.5 text-sm" value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)} />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="1" className="input py-1.5 text-sm text-center w-16"
                          value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="0" className="input py-1.5 text-sm text-right w-28"
                          value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                      </td>
                      <td className="py-2 pl-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 pl-1">
                        <button onClick={() => removeItem(idx)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors">
              <FiPlus size={14} /> Add line item
            </button>

            {/* Totals */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span>Tax (GST)</span>
                  <input type="number" min="0" max="100" value={taxPct}
                    onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                    className="input py-1 px-2 w-16 text-sm text-center" />
                  <span>%</span>
                </div>
                <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-700 pt-2">
                <span>Total</span>
                <span className="text-primary-600 dark:text-primary-400">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary gap-2">
                <FiChevronLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(3)} className="btn-primary gap-2">
                Next <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Note & Send ── */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            {/* Summary */}
            <div className="rounded-xl p-4 bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/8">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900 dark:text-white">{selected?.name}</p>
                <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>📧 To: {client.email}</span>
                <span>🏢 {client.company_name}</span>
                <span>📦 {items.length} line items</span>
                <span>⏱ {selected?.timeline}</span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="input h-28 resize-none"
                placeholder="Add a personal message to the client..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="btn-secondary gap-2">
                <FiChevronLeft size={16} /> Back
              </button>
              <button onClick={handleSend} disabled={sending} className="btn-gold gap-2 px-6">
                {sending
                  ? <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Sending...</>
                  : <><FiSend size={15} /> Send Proposal</>
                }
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
