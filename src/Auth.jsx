import { useState } from 'react';
import { C, FONT, uid, sha, inputCls, primaryBtn, Field, newBoard } from './shared.jsx';

/** Sign in / sign up screen. Props: db, setDb, setSession (from App). */
export default function Auth({ db, setDb, setSession }) {
    const [mode, setMode] = useState(db.users.some((u) => u.hash) ? 'in' : 'up');
    const [f, setF] = useState({ name: '', email: '', github: '', pw: '' });
    const [err, setErr] = useState('');
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const email = f.email.trim().toLowerCase();
        const hash = await sha(f.pw);
        const existing = db.users.find((u) => u.email === email);
        if (mode === 'in') {
            if (!existing || existing.hash !== hash) return setErr('Email or password is incorrect.');
            return setSession(existing.id);
        }
        if (f.pw.length < 8) return setErr('Use a password with at least 8 characters.');
        if (existing?.hash) return setErr('That email already has an account. Sign in instead.');
        if (existing) { // claim an account a teammate added for you
            setDb({ ...db, users: db.users.map((u) => (u.id === existing.id ? { ...u, hash, name: f.name || u.name } : u)) });
            return setSession(existing.id);
        }
        const user = { id: uid(), name: f.name.trim(), email, github: f.github.trim(), hash };
        const org = { id: uid(), name: 'My organization', ownerId: user.id, memberIds: [user.id] };
        const team = { id: uid(), name: 'My team', orgId: org.id, memberIds: [user.id] };
        const board = newBoard('First Board', team.id, [user.id], user.id);
        setDb({ users: [...db.users, user], orgs: [...(db.orgs || []), org], teams: [...db.teams, team], boards: [...db.boards, board] });
        setSession(user.id);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6" style={{ fontFamily: FONT }}>
            <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-[#E4E4E4] p-6">
                <h1 className="text-[16pt] font-semibold" style={{ color: C.brandText }}>Lucid Board</h1>
                <p className="text-[14pt]" style={{ color: C.soft }}>{mode === 'in' ? 'Sign in to your boards.' : 'Create your account to start a board.'}</p>
                {mode === 'up' && <Field label="Name"><input required className={inputCls} value={f.name} onChange={set('name')} /></Field>}
                <Field label="Email"><input required type="email" className={inputCls} value={f.email} onChange={set('email')} /></Field>
                {mode === 'up' && <Field label="GitHub username"><input className={inputCls} value={f.github} onChange={set('github')} /></Field>}
                <Field label="Password"><input required type="password" className={inputCls} value={f.pw} onChange={set('pw')} /></Field>
                {err && <p role="alert" className="text-[14pt]" style={{ color: C.bug }}>{err}</p>}
                <button className={`${primaryBtn} w-full justify-center`}>{mode === 'in' ? 'Sign in' : 'Create account'}</button>
                <button type="button" className="text-[14pt] underline" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); }}>
                    {mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
                </button>
            </form>
        </div>
    );
}