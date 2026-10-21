import { useState, useEffect } from 'react';

/** Shared constants, helpers and form styles used by App.jsx and Auth.jsx. */

export const STAGES = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
];

// Palette from DESIGN.md. "ink-soft" and "brand-text" are darker than the spec'd
// muted/brand colours so text meets WCAG AA contrast on white.
// shared.jsx
export const C = {
    bg: '#F9F8F6', // Warm off-white/cream
    tint: '#EFECE7', // Beige/matte grey for hover states
    primary: '#2C4A3B', // Deep forest green
    brandText: '#1D3F42', // Dark teal for primary text
    ink: '#1A1A1A',
    soft: '#6B6B6B',
    line: '#E5E5E5',
    feature: '#2E6F40',
    bug: '#8B3A3A',
    safe: '#2E6F40',
    warn: '#A68A36',
    over: '#9C5A24',
    neutral: '#A3A3A3'
};

// Structured, modern geometric sans-serif stack
export const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const DEFAULT_IMPORTANCE = [
    { id: 'critical', label: 'Critical', color: '#C41818' },
    { id: 'high', label: 'High', color: '#CF8600' },
    { id: 'medium', label: 'Medium', color: '#B57EDC' },
    { id: 'low', label: 'Low', color: '#9A9A9A' },
];
export const ANCHORS = ['Presentation', 'Demo', 'Report', 'Documentation'];

export const uid = () => Math.random().toString(36).slice(2, 9);
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try { const raw = window.localStorage.getItem(key); return raw != null ? JSON.parse(raw) : initialValue; }
        catch { return initialValue; }
    });
    useEffect(() => {
        try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    }, [key, value]);
    return [value, setValue];
}

// shared.jsx
export const inputCls = 'w-full rounded-md border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-[14px] text-[#1A1A1A] placeholder:text-[#A3A3A3] transition-all focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] shadow-sm';

export const btnCls = 'inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-[14px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3B] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40';

export const primaryBtn = `${btnCls} border-[#2C4A3B] bg-[#2C4A3B] text-white hover:bg-[#1D3228] hover:border-[#1D3228] shadow-sm`;

export const ghostBtn = `${btnCls} border-transparent bg-transparent text-[#1A1A1A] hover:bg-[#EFECE7]`;

export const Field = ({ label, children }) => (
    <label className="block text-[14px]"><span className="mb-1.5 block text-[13px] font-medium text-[#2A2A2A]">{label}</span>{children}</label>
);

/** Brand mark: three board columns. */
export const Logo = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
        <rect width="28" height="28" rx="7" fill={C.primary} />
        <rect x="6" y="7" width="4" height="14" rx="1.5" fill={C.ink} />
        <rect x="12" y="7" width="4" height="10" rx="1.5" fill={C.ink} />
        <rect x="18" y="7" width="4" height="6" rx="1.5" fill={C.ink} />
    </svg>
);

/** Initials in a circle. Greyed out when there is no name (unassigned). */
export const Avatar = ({ name, size = 24 }) => {
    const ini = (name || '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    return (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
              style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: name ? '#EBDDF6' : '#EDEDED', color: name ? C.brandText : C.soft }}>{ini}</span>
    );
};

export function newBoard(name, teamId, memberIds, userId) {
    const now = todayISO();
    const mk = (title, type, status, importance, due) => ({ id: uid(), title, description: '', type, status, assignee: userId, dueDate: due, createdDate: now, updatedAt: new Date().toISOString(), importance, context: '' });
    const plus = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
    return {
        id: uid(), name, teamId, memberIds, columns: STAGES.map((s) => ({ ...s })), importance: DEFAULT_IMPORTANCE.map((i) => ({ ...i })),
        anchors: Object.fromEntries(ANCHORS.map((a) => [a, ''])),
        tasks: [
            mk('Set up project repo', 'feature', 'done', 'medium', null),
            mk('Login redirect loops on Safari', 'bug', 'in-progress', 'critical', plus(0)),
            mk('Add search to issue list', 'feature', 'todo', 'low', plus(5)),
        ],
    };
}


/** Upgrades older saved data (team.org string) to the orgs list. */
export function migrate(db) {
    if (db.orgs) return db;
    const nm = (t) => t.org || 'My organization';
    const names = [...new Set(db.teams.map(nm))];
    const orgs = names.map((n) => ({ id: uid(), name: n, memberIds: [...new Set(db.teams.filter((t) => nm(t) === n).flatMap((t) => t.memberIds))] }));
    return { ...db, orgs, teams: db.teams.map((t) => ({ ...t, orgId: orgs.find((o) => o.name === nm(t)).id })) };
}