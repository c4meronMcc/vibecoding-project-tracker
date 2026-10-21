import { Component, useState, useEffect, useRef } from 'react';
import { Plus, Copy, Trash2, Bug, Sparkles, LogOut, Users, Tags, Columns3, ExternalLink, X, Building2 } from 'lucide-react';

/**
 * Lucid Board: Kanban for software teams. (Login lives in Auth.jsx; shared helpers in shared.jsx.)
 * Data lives in localStorage (prototype). Passwords are SHA-256 hashed in the browser,
 * which gates the UI only. Real security needs a backend.
 */
import { C, FONT, MONO, ANCHORS, todayISO, uid, useLocalStorage, migrate, inputCls, primaryBtn, ghostBtn, Field, newBoard, Avatar, Logo } from './shared.jsx';
import Auth from './Auth.jsx';

function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input,select,textarea,button')?.focus();
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('keydown', esc); prev?.focus?.(); };
  }, [onClose]);
  return (
      <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#0A0A0A]/45 p-4 pt-16" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div ref={ref} role="dialog" aria-modal="true" aria-label={title}
             className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} rounded-xl border border-[#E4E4E4] bg-white p-6 shadow-2xl`}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="rounded-md p-1.5 text-[#5E5E5E] hover:bg-[#F3F3F3] hover:text-[#0A0A0A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2FA0]"><X size={16} /></button>
          </div>
          {children}
        </div>
      </div>
  );
}

/* ---------- Due state ---------- */
function dueState(task, doneId) {
  if (task.status === doneId) return { color: C.neutral, label: 'Done' };
  if (!task.dueDate) return null;
  const days = Math.round((new Date(task.dueDate) - new Date(todayISO())) / 864e5);
  if (days < 0) return { color: C.over, label: 'Overdue' };
  if (days <= 1) return { color: C.warn, label: 'Due soon' };
  if (days > 2) return { color: C.safe, label: 'On track' };
  return { color: C.neutral, label: 'Upcoming' };
}

/* ---------- Task modal ---------- */
function TaskModal({ board, members, task, onSave, onDelete, onClose, toast }) {
  const [d, setD] = useState(task || { title: '', description: '', type: 'feature', status: board.columns[0].id, assignee: members[0]?.id || '', dueDate: '', createdDate: todayISO(), importance: board.importance[2]?.id || board.importance[0].id, context: '' });
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const copyContext = async () => { try { await navigator.clipboard.writeText(d.context); toast('Copied!'); } catch { toast('Copy failed. Select the text and copy it manually.'); } };
  const copyPrompt = async () => {
    const who = members.find((m) => m.id === d.assignee)?.name || 'Unassigned';
    const imp = board.importance.find((i) => i.id === d.importance)?.label;
    const text = `# ${d.type === 'bug' ? 'Bug' : 'Feature'}: ${d.title}\nStatus: ${board.columns.find((c) => c.id === d.status)?.label} | Importance: ${imp} | Assignee: ${who} | Due: ${d.dueDate || 'none'}\n\n## Description\n${d.description || '(none)'}\n\n## Context\n${d.context || '(none)'}\n`;
    try { await navigator.clipboard.writeText(text); toast('Copied!'); } catch { toast('Copy failed.'); }
  };
  const submit = (e) => { e.preventDefault(); onSave({ ...d, dueDate: d.dueDate || null, updatedAt: new Date().toISOString(), id: d.id || uid() }); };
  return (
      <Modal title={task ? 'Edit issue' : 'Add issue'} onClose={onClose} wide>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Title"><input required className={inputCls} value={d.title} onChange={set('title')} /></Field>
          <Field label="Description"><textarea rows={3} className={inputCls} value={d.description} onChange={set('description')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><select className={inputCls} value={d.type} onChange={set('type')}><option value="feature">Feature</option><option value="bug">Bug</option></select></Field>
            <Field label="Status"><select className={inputCls} value={d.status} onChange={set('status')}>{board.columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
            <Field label="Assignee"><select className={inputCls} value={d.assignee} onChange={set('assignee')}><option value="">Unassigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
            <Field label="Importance"><select className={inputCls} value={d.importance} onChange={set('importance')}>{board.importance.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select></Field>
            <Field label="Due date"><input type="date" className={inputCls} value={d.dueDate || ''} onChange={set('dueDate')} /></Field>
            <Field label="Date created"><input readOnly className={`${inputCls} !bg-[#F7F7F7] !text-[#5E5E5E]`} value={d.createdDate} /></Field>
          </div>
          <Field label="Context (logs, AI chats, notes)">
            <textarea rows={5} className={`${inputCls} font-mono !text-[13px]`} style={{ fontFamily: MONO }} value={d.context} onChange={set('context')} />
          </Field>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" className={ghostBtn} onClick={copyContext}><Copy size={14} />Copy context</button>
            <button type="button" className={ghostBtn} onClick={copyPrompt}><Copy size={14} />Copy as prompt context</button>
          </div>
          <div className="flex items-center justify-between border-t border-[#E4E4E4] pt-3">
            {task ? <button type="button" className={`${ghostBtn} text-[#C41818]`} onClick={() => window.confirm("Delete this task? You can't undo.") && onDelete(task.id)}><Trash2 size={14} />Delete</button> : <span />}
            <button className={primaryBtn}>{task ? 'Save changes' : 'Add issue'}</button>
          </div>
        </form>
      </Modal>
  );
}

/* ---------- People modal ---------- */
function PeopleModal({ db, setDb, team, board, onClose }) {
  const [f, setF] = useState({ name: '', email: '', github: '' });
  const [err, setErr] = useState('');
  const members = db.users.filter((u) => team.memberIds.includes(u.id));
  const toggle = (uidv) => setDb({ ...db, boards: db.boards.map((b) => b.id !== board.id ? b : { ...b, memberIds: b.memberIds.includes(uidv) ? b.memberIds.filter((x) => x !== uidv) : [...b.memberIds, uidv] }) });
  const add = (e) => {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    let user = db.users.find((u) => u.email === email);
    if (user && team.memberIds.includes(user.id)) return setErr('That person is already on this team.');
    const users = user ? db.users : [...db.users, (user = { id: uid(), name: f.name.trim(), email, github: f.github.trim(), hash: null })];
    setDb({ ...db, users, teams: db.teams.map((t) => t.id === team.id ? { ...t, memberIds: [...t.memberIds, user.id] } : t),
      boards: db.boards.map((b) => b.id === board.id ? { ...b, memberIds: [...b.memberIds, user.id] } : b) });
    setF({ name: '', email: '', github: '' }); setErr('');
  };
  return (
      <Modal title={`People on ${team.name}`} onClose={onClose} wide>
        <ul className="mb-4 divide-y divide-[#E4E4E4] text-[14px]">
          {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3"><Avatar name={m.name} size={34} /><div className="min-w-0"><div className="font-medium">{m.name}</div><div className="truncate text-[13px]" style={{ color: C.soft }}>{m.email}{m.github && ` · github.com/${m.github}`}</div></div></div>
                <label className="flex shrink-0 items-center gap-2 text-[13px]"><input type="checkbox" className="h-4 w-4 accent-[#6B2FA0]" checked={board.memberIds.includes(m.id)} onChange={() => toggle(m.id)} />Access to this board</label>
              </li>
          ))}
        </ul>
        <form onSubmit={add} className="grid grid-cols-3 gap-2">
          <input required aria-label="Name" placeholder="Name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input required type="email" aria-label="Email" placeholder="Email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input aria-label="GitHub username" placeholder="GitHub" className={inputCls} value={f.github} onChange={(e) => setF({ ...f, github: e.target.value })} />
          {err && <p role="alert" className="col-span-3 text-[14px]" style={{ color: C.bug }}>{err}</p>}
          <button className={`${primaryBtn} col-span-3 justify-center`}>Add member</button>
        </form>
        <p className="mt-2 text-[13px]" style={{ color: C.soft }}>New members sign up with this email to claim their account.</p>
      </Modal>
  );
}

/* ---------- Columns + importance editors ---------- */
function ColumnsModal({ board, update, onClose }) {
  const [name, setName] = useState('');
  const cols = board.columns;
  const rename = (id, label) => update((b) => ({ ...b, columns: b.columns.map((c) => c.id === id ? { ...c, label } : c) }));
  const remove = (id) => cols.length > 1 && window.confirm('Delete this section? Its issues move to the first remaining section.') &&
      update((b) => { const rest = b.columns.filter((c) => c.id !== id); return { ...b, columns: rest, tasks: b.tasks.map((t) => t.status === id ? { ...t, status: rest[0].id } : t) }; });
  return (
      <Modal title="Sections" onClose={onClose}>
        <ul className="mb-3 space-y-2">{cols.map((c) => (
            <li key={c.id} className="flex gap-2"><input aria-label="Section name" className={inputCls} value={c.label} onChange={(e) => rename(c.id, e.target.value)} />
              <button aria-label={`Delete ${c.label}`} className={ghostBtn} onClick={() => remove(c.id)} disabled={cols.length < 2}><Trash2 size={14} /></button></li>))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { update((b) => ({ ...b, columns: [...b.columns, { id: uid(), label: name.trim() }] })); setName(''); } }}>
          <input aria-label="New section name" placeholder="New section" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          <button className={primaryBtn}>Add</button>
        </form>
        <p className="mt-2 text-[13px]" style={{ color: C.soft }}>The last section counts as “done” for due-date tinting.</p>
      </Modal>
  );
}

function ImportanceModal({ board, update, onClose }) {
  const edit = (id, patch) => update((b) => ({ ...b, importance: b.importance.map((i) => i.id === id ? { ...i, ...patch } : i) }));
  return (
      <Modal title="Importance levels" onClose={onClose}>
        <ul className="space-y-2">{board.importance.map((i) => (
            <li key={i.id} className="flex items-center gap-2">
              <input type="color" aria-label={`Colour for ${i.label}`} value={i.color} onChange={(e) => edit(i.id, { color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[#CFCFCF] bg-white p-0.5" />
              <input aria-label="Importance label" className={inputCls} value={i.label} onChange={(e) => edit(i.id, { label: e.target.value })} />
            </li>))}</ul>
      </Modal>
  );
}

/* ---------- Sidebar ---------- */
function AddRow({ label, onAdd }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');
  if (!open) return (
      <button className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[13px] text-[#5E5E5E] hover:bg-[#F3F3F3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B57EDC]" onClick={() => setOpen(true)}>
        <Plus size={14} />{label}
      </button>);
  return (
      <form className="flex gap-1 px-1" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV(''); setOpen(false); } }}>
        <input autoFocus aria-label={label} placeholder="Name" className={`${inputCls} !py-1 text-[13px]`} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
        <button className={`${primaryBtn} !px-2 text-[13px]`}>Add</button>
      </form>);
}

function Sidebar({ me, db, setDb, boardId, onSelect }) {
  const orgs = db.orgs.filter((o) => o.memberIds.includes(me.id));
  const addOrg = (name) => setDb((d) => ({ ...d, orgs: [...d.orgs, { id: uid(), name, memberIds: [me.id] }] }));
  const addTeam = (orgId, name) => setDb((d) => ({ ...d, teams: [...d.teams, { id: uid(), name, orgId, memberIds: [me.id] }] }));
  const addBoard = (team, name) => { const b = newBoard(name, team.id, [me.id], me.id); b.tasks = []; setDb((d) => ({ ...d, boards: [...d.boards, b] })); onSelect(b.id); };
  return (
      <nav aria-label="Organizations, teams and boards" className="shrink-0 overflow-y-auto border-b border-[#E4E4E4] p-4 md:w-72 md:border-b-0 md:border-r">
        <h1 className="text-[18px] font-semibold" style={{ color: C.brandText }}>Lucid Board</h1>
        {orgs.map((o) => (
            <div key={o.id} className="mt-5">
              <h2 className="flex items-center gap-1.5 text-[14px] font-semibold"><Building2 size={16} aria-hidden="true" />{o.name}</h2>
              {db.teams.filter((t) => t.orgId === o.id && t.memberIds.includes(me.id)).map((t) => (
                  <div key={t.id} className="ml-3 mt-3">
                    <h3 className="text-[13px] font-bold" style={{ color: C.soft }}>{t.name}</h3>
                    <ul>
                      {db.boards.filter((b) => b.teamId === t.id && b.memberIds.includes(me.id)).map((b) => (
                          <li key={b.id}>
                            <button aria-current={b.id === boardId ? 'page' : undefined} onClick={() => onSelect(b.id)}
                                    className={`w-full rounded px-2 py-1 text-left text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B57EDC] ${b.id === boardId ? 'bg-[#F1E6F8] font-bold' : 'hover:bg-[#F3F3F3]'}`}>{b.name}</button>
                          </li>))}
                    </ul>
                    <AddRow label="Add board" onAdd={(n) => addBoard(t, n)} />
                  </div>))}
              <div className="ml-3 mt-2"><AddRow label="Add team" onAdd={(n) => addTeam(o.id, n)} /></div>
            </div>))}
        <div className="mt-5 border-t border-[#E4E4E4] pt-3"><AddRow label="Add organization" onAdd={addOrg} /></div>
      </nav>
  );
}

/* ---------- App ---------- */
function AppInner() {
  const [raw, setDb] = useLocalStorage('lucid.db', { users: [], orgs: [], teams: [], boards: [] });
  const [session, setSession] = useLocalStorage('lucid.session', null);
  const [sel, setSel] = useState({ teamId: null, boardId: null });
  const [modal, setModal] = useState(null); // 'task' | 'people' | 'columns' | 'importance'
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null); // { kind: 'org'|'team'|'board', parentId }
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);
  const [msg, setMsg] = useState('');
  const db = migrate(raw);
  useEffect(() => { if (!raw.orgs) setDb(db); }, []); // eslint-disable-line
  const toast = (t) => { setMsg(t); setTimeout(() => setMsg(''), 1800); };

  const me = db.users.find((u) => u.id === session);
  if (!me) return <Auth db={db} setDb={setDb} setSession={setSession} />;

  const myTeams = db.teams.filter((t) => t.memberIds.includes(me.id));
  const myOrgs = db.orgs.filter((o) => o.ownerId === me.id || myTeams.some((t) => t.orgId === o.id));
  const boardsOf = (t) => db.boards.filter((b) => b.teamId === t.id && b.memberIds.includes(me.id)); // authorization gate
  const team = myTeams.find((t) => t.id === sel.teamId) || myTeams[0];
  const board = team && (boardsOf(team).find((b) => b.id === sel.boardId) || boardsOf(team)[0]);
  const members = db.users.filter((u) => team?.memberIds.includes(u.id) && board?.memberIds.includes(u.id));

  const update = (fn) => setDb((d) => ({ ...migrate(d), boards: d.boards.map((b) => b.id === board.id ? fn(b) : b) }));
  const saveTask = (t) => { update((b) => ({ ...b, tasks: b.tasks.some((x) => x.id === t.id) ? b.tasks.map((x) => x.id === t.id ? t : x) : [...b.tasks, t] })); setModal(null); setEditing(null); };
  const delTask = (id) => { update((b) => ({ ...b, tasks: b.tasks.filter((x) => x.id !== id) })); setModal(null); setEditing(null); };
  const move = (id, status) => update((b) => ({ ...b, tasks: b.tasks.map((t) => t.id === id && t.status !== status ? { ...t, status, updatedAt: new Date().toISOString() } : t) }));
  const close = () => { setModal(null); setEditing(null); };
  const doneId = board?.columns[board.columns.length - 1].id;

  const submitAdd = (e) => {
    e.preventDefault();
    const n = new FormData(e.target).get('n').trim();
    if (!n) return;
    const { kind, parentId } = adding;
    if (kind === 'org') setDb({ ...db, orgs: [...db.orgs, { id: uid(), name: n, ownerId: me.id }] });
    if (kind === 'team') { const t = { id: uid(), name: n, orgId: parentId, memberIds: [me.id] }; setDb({ ...db, teams: [...db.teams, t] }); setSel({ teamId: t.id, boardId: null }); }
    if (kind === 'board') { const b = newBoard(n, parentId, [me.id], me.id); b.tasks = []; setDb({ ...db, boards: [...db.boards, b] }); setSel({ teamId: parentId, boardId: b.id }); }
    setAdding(null);
  };
  const addLink = 'flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-[13px] text-[#5E5E5E] hover:bg-[#F3F3F3] hover:text-[#6B2FA0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2FA0]';

  return (
      <div className="flex min-h-screen flex-col bg-[#F6F4F8] text-[#0A0A0A] md:flex-row" style={{ fontFamily: FONT }}>
        <a href="#board" className="sr-only focus:not-sr-only">Skip to board</a>

        <nav aria-label="Workspaces" className="flex w-full shrink-0 flex-col border-b border-[#E4E4E4] bg-white p-4 md:w-64 md:border-b-0 md:border-r">
          <h1 className="mb-5 flex items-center gap-2.5 px-1 text-[19px] font-semibold tracking-tight" style={{ color: C.brandText }}><Logo size={26} />Lucid Board</h1>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {myOrgs.map((o) => (
                <section key={o.id} aria-label={o.name}>
                  <h2 className="flex items-center gap-1.5 px-1 text-[14px] font-semibold"><Building2 size={15} aria-hidden="true" />{o.name}</h2>
                  {myTeams.filter((t) => t.orgId === o.id).map((t) => (
                      <div key={t.id} className="ml-2 mt-2">
                        <h3 className="px-2 text-[13px] font-medium" style={{ color: C.soft }}>{t.name}</h3>
                        <ul className="ml-2">
                          {boardsOf(t).map((b) => (
                              <li key={b.id}>
                                <button aria-current={b.id === board?.id ? 'page' : undefined} onClick={() => setSel({ teamId: t.id, boardId: b.id })}
                                        className={`w-full rounded-md px-2.5 py-1.5 text-left text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2FA0] ${b.id === board?.id ? 'bg-[#F4ECFA] font-semibold text-[#6B2FA0] shadow-[inset_3px_0_0_#B57EDC]' : 'text-[#2A2A2A] hover:bg-[#F3F3F3]'}`}>{b.name}</button>
                              </li>))}
                        </ul>
                        <button className={`${addLink} ml-2`} onClick={() => setAdding({ kind: 'board', parentId: t.id })}><Plus size={13} aria-hidden="true" />Add board</button>
                      </div>))}
                  <button className={`${addLink} ml-2 mt-1`} onClick={() => setAdding({ kind: 'team', parentId: o.id })}><Plus size={13} aria-hidden="true" />Add team</button>
                </section>))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#E4E4E4] pt-3">
            <button className={addLink} onClick={() => setAdding({ kind: 'org' })}><Plus size={13} aria-hidden="true" />Add organisation</button>
            <button className={`${ghostBtn} w-full justify-between`} aria-label={`Sign out ${me.name}`} onClick={() => setSession(null)}><span className="flex min-w-0 items-center gap-2"><Avatar name={me.name} size={22} /><span className="truncate">{me.name}</span></span><LogOut size={14} /></button>
          </div>
        </nav>

        <div className="min-w-0 flex-1 p-5 md:p-8">
          {!board ? (
              <p className="py-16 text-center text-sm" style={{ color: C.soft }}>You don’t have access to a board yet. Use “Add board” in the side nav to create one.</p>
          ) : (<>
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[26px] font-semibold tracking-tight">{board.name}</h2>
                <p className="mt-0.5 text-[14px]" style={{ color: C.soft }}>{team.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className={ghostBtn} onClick={() => setModal('people')}><Users size={14} />People</button>
                <button className={ghostBtn} onClick={() => setModal('columns')}><Columns3 size={14} />Sections</button>
                <button className={ghostBtn} onClick={() => setModal('importance')}><Tags size={14} />Importance</button>
                <button className={primaryBtn} onClick={() => { setEditing(null); setModal('task'); }}><Plus size={14} />Add issue</button>
              </div>
            </header>

            <section aria-label="Project links" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ANCHORS.map((a) => (
                  <div key={a} className="rounded-lg border border-[#E4E4E4] bg-white p-3">
                    <div className="mb-1.5 flex items-center justify-between text-[13px] font-semibold">{a}
                      {board.anchors[a] && <a aria-label={`Open ${a}`} href={board.anchors[a]} target="_blank" rel="noreferrer noopener" className="rounded p-0.5 text-[#6B2FA0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2FA0]"><ExternalLink size={14} /></a>}</div>
                    <input type="url" aria-label={`${a} URL`} placeholder="https://" className={`${inputCls} !py-1.5 !text-[13px]`} value={board.anchors[a]} onChange={(e) => update((b) => ({ ...b, anchors: { ...b.anchors, [a]: e.target.value } }))} />
                  </div>))}
            </section>

            <main id="board" className="-m-1 grid gap-4 p-1" style={{ gridTemplateColumns: `repeat(${board.columns.length}, minmax(240px, 1fr))`, overflowX: 'auto' }}>
              {board.columns.map((col, ci) => {
                const tasks = board.tasks.filter((t) => t.status === col.id);
                const hot = dragId && over === col.id;
                const dot = ci === board.columns.length - 1 ? C.feature : ci === 0 ? '#9A9A9A' : C.primary; // stage progress: first, middle, last
                return (
                    <section key={col.id} aria-label={col.label}
                             onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(col.id); }}
                             onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); }}
                             onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || dragId; if (id) move(id, col.id); setDragId(null); setOver(null); }}
                             className={`min-h-[12rem] min-w-[240px] rounded-xl p-2.5 transition-colors ${hot ? 'bg-[#F4ECFA] ring-2 ring-[#B57EDC]' : 'bg-[#EDE9F1]'}`}>
                      <h3 className="mb-3 flex items-center gap-2 px-1 text-[13px] font-semibold"><span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: dot }} />{col.label}<span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[12px] font-medium" style={{ color: C.soft }}>{tasks.length}</span></h3>
                      <div className="space-y-2">
                        {tasks.length === 0 && <p className="rounded-lg border border-dashed border-[#C9BFD4] px-3 py-5 text-center text-[13px]" style={{ color: C.soft }}>No issues here. Drag one in or add a new issue.</p>}
                        {tasks.map((t) => {
                          const imp = board.importance.find((i) => i.id === t.importance);
                          const due = dueState(t, doneId);
                          const who = db.users.find((u) => u.id === t.assignee);
                          return (
                              <article key={t.id} draggable
                                       onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setDragId(t.id); }}
                                       onDragEnd={() => { setDragId(null); setOver(null); }}
                                       className="cursor-grab rounded-lg border border-[#E4E4E4] bg-white p-3.5 shadow-[0_1px_2px_rgba(20,10,30,0.06)] transition-shadow hover:shadow-md active:cursor-grabbing"
                                       style={{ borderLeft: `4px solid ${imp?.color || C.neutral}`, opacity: dragId === t.id ? 0.4 : 1 }}>
                                <button className="block w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B2FA0]" onClick={() => { setEditing(t); setModal('task'); }}>
                                  <div className="flex items-start gap-2 text-[14px] font-medium leading-snug">
                                    {t.type === 'bug' ? <Bug size={14} aria-label="Bug" className="mt-0.5 shrink-0" style={{ color: C.bug }} /> : <Sparkles size={14} aria-label="Feature" className="mt-0.5 shrink-0" style={{ color: '#008A24' }} />}
                                    <span>{t.title}</span>
                                  </div>
                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                                    <span className="rounded-full px-2 py-0.5 font-medium text-[#0A0A0A]" style={{ background: `${imp?.color || C.neutral}33`, border: `1px solid ${imp?.color || C.neutral}` }}>{imp?.label}</span>
                                    {due && <span className="rounded-full px-2 py-0.5 font-medium text-[#0A0A0A]" style={{ background: `${due.color}40`, border: `1px solid ${due.color}` }}>{t.dueDate && t.status !== doneId ? `${due.label} · ${t.dueDate}` : due.label}</span>}
                                  </div>
                                  <div className="mt-3 flex items-center justify-between gap-2 text-[12px]" style={{ color: C.soft }}><span className="flex min-w-0 items-center gap-1.5"><Avatar name={who?.name} size={20} /><span className="truncate">{who?.name || 'Unassigned'}</span></span><span className="shrink-0">Updated {new Date(t.updatedAt).toLocaleDateString()}</span></div>
                                </button>
                                <label className="mt-3 block text-[12px]"><span className="sr-only">Move {t.title} to</span>
                                  <select className={`${inputCls} !border-[#E4E4E4] !bg-[#F6F4F8] !py-1 !text-[12px]`} value={t.status} onChange={(e) => move(t.id, e.target.value)}>{board.columns.map((c) => <option key={c.id} value={c.id}>Move to {c.label}</option>)}</select></label>
                              </article>);
                        })}
                      </div>
                    </section>);
              })}
            </main>
          </>)}
        </div>

        {modal === 'task' && board && <TaskModal key={editing?.id || 'new'} board={board} members={members} task={editing} onSave={saveTask} onDelete={delTask} onClose={close} toast={toast} />}
        {modal === 'people' && <PeopleModal db={db} setDb={setDb} team={team} board={board} onClose={close} />}
        {modal === 'columns' && <ColumnsModal board={board} update={update} onClose={close} />}
        {modal === 'importance' && <ImportanceModal board={board} update={update} onClose={close} />}
        {adding && (
            <Modal title={`Add ${adding.kind === 'org' ? 'organisation' : adding.kind}`} onClose={() => setAdding(null)}>
              <form onSubmit={submitAdd} className="space-y-3">
                <Field label="Name"><input name="n" required className={inputCls} /></Field>
                <button className={primaryBtn}>{`Add ${adding.kind === 'org' ? 'organisation' : adding.kind}`}</button>
              </form>
            </Modal>)}
        <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2">
          {msg && <div className="rounded-md bg-[#0A0A0A] px-4 py-2 text-[14px] font-medium text-white shadow-lg transition-opacity duration-200">{msg}</div>}
        </div>
      </div>
  );
}

/** Shows the error on screen instead of a blank page, with a way to clear saved data. */
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
        <div role="alert" className="mx-auto max-w-xl p-8" style={{ fontFamily: FONT }}>
          <h1 className="mb-2 text-2xl font-semibold">Something went wrong</h1>
          <pre className="mb-4 whitespace-pre-wrap rounded border border-[#E4E4E4] p-3 text-sm">{String(this.state.error?.stack || this.state.error)}</pre>
          <button className={primaryBtn} onClick={() => { try { localStorage.removeItem('lucid.db'); localStorage.removeItem('lucid.session'); } catch { /* ignore */ } location.reload(); }}>Clear saved data and reload</button>
        </div>
    );
  }
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}