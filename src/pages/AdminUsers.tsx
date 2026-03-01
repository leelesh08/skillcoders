import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToAuthChanges, getIdTokenResult } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import { api } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';

type User = {
  id: string;
  name?: string;
  email: string;
  roles?: string[];
};

type AdminUsersResponse = { users?: User[] };
type SingleUserResponse = { user?: User };

const AdminUsers = () => {
  const [users, setUsers] = useState<User[] | null>(null);
  const [adminKey, setAdminKey] = useState<string>(() => {
    try { return localStorage.getItem('admin_action_key') || ''; } catch (e) { return ''; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState('');
  const [claimsText, setClaimsText] = useState('{"admin":true}');
  const [reason, setReason] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const unsub = subscribeToAuthChanges(async (user) => {
      if (!mounted) return;
      if (!user) {
        navigate('/');
        return;
      }
      try {
        const tokenResult = await getIdTokenResult(user);
        const claims = tokenResult.claims || {};
        const isAdmin = Boolean(claims.admin === true || (Array.isArray(claims.roles) && (claims.roles as unknown[]).includes('admin')));
        if (!isAdmin) {
          navigate('/');
          return;
        }
      } catch (e) {
        navigate('/');
        return;
      }

      setLoading(true);
      api
        .get('/api/admin/users', { headers: { 'x-admin-action-key': adminKey } })
        .then((data: AdminUsersResponse) => {
          if (!mounted) return;
          setUsers(Array.isArray(data.users) ? data.users : []);
        })
        .catch((err) => setError(String(err)))
        .finally(() => { if (mounted) setLoading(false); });
    });

    return () => { mounted = false; unsub(); };
  }, [navigate, adminKey]);

  const startAdd = () => setEditing({ id: '', email: '' } as User);
  const startEdit = (u: User) => setEditing({ ...u });

  const saveUser = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (!editing.id) {
        // create
        const res = await api.post('/api/admin/users', editing, { headers: { 'x-admin-action-key': adminKey } }) as SingleUserResponse;
        if (res.user) setUsers((prev) => (prev ? [...prev, res.user as User] : [res.user as User]));
      } else {
        const res = await api.put(`/api/admin/users/${encodeURIComponent(editing.id)}`, editing, { headers: { 'x-admin-action-key': adminKey } }) as SingleUserResponse;
        if (res.user) setUsers((prev) => (prev ? prev.map((p) => (String(p.id) === String(editing.id) ? res.user as User : p)) : [res.user as User]));
      }
      setEditing(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!users) return;
    setSaving(true);
    try {
      const res = await api.delete(`/api/admin/users/${encodeURIComponent(id)}`, { headers: { 'x-admin-action-key': adminKey } });
      setUsers((prev) => (prev ? prev.filter((u) => String(u.id) !== String(id)) : []));
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading users..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Admin — Users</h2>
            <div className="flex gap-2 items-center">
              <Input placeholder="Admin key (x-admin-action-key)" value={adminKey} onChange={(e) => { setAdminKey(e.target.value); try { localStorage.setItem('admin_action_key', e.target.value); } catch (err) { console.warn('Could not persist admin_action_key', err); } }} />
              <Button onClick={startAdd}>Add User</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              {users && users.length === 0 && <div className="text-muted-foreground">No users</div>}
              {users && users.map((u) => (
                <GlowCard key={u.id} className="p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{u.name || u.email}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEdit(u)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(String(u.id))} disabled={saving}>Delete</Button>
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>

            <div>
              {editing ? (
                <GlowCard className="p-4">
                  <h3 className="font-semibold mb-2">{editing.id ? 'Edit User' : 'Add User'}</h3>
                  <div className="space-y-2">
                    <label className="block text-sm">ID</label>
                    <Input value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} />
                    <label className="block text-sm">Name</label>
                    <Input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    <label className="block text-sm">Email</label>
                    <Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                    <label className="block text-sm">Roles (comma separated)</label>
                    <Input value={(editing.roles || []).join(',')} onChange={(e) => setEditing({ ...editing, roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                    <div className="flex gap-2 mt-3">
                      <Button onClick={saveUser} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                      <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                </GlowCard>
              ) : (
                <div className="text-muted-foreground">Select a user to edit or click "Add User".</div>
              )}
            </div>
          </div>

          {/* Manage claims panel */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlowCard className="p-4">
              <h3 className="font-semibold mb-2">Manage User Claims</h3>
              <label className="block mb-2">Target UID</label>
              <Input value={uid} onChange={(e) => setUid(e.target.value)} className="mb-3" />
              <label className="block mb-2">Claims (JSON)</label>
              <textarea rows={4} placeholder="Enter claims in JSON format" value={claimsText} onChange={(e) => setClaimsText(e.target.value)} className="w-full p-2 border rounded mb-3" />
              <label className="block mb-2">Reason (optional)</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} className="mb-3" />
              <label className="block mb-2">Admin Action Key (if required)</label>
              <Input value={adminKey} onChange={(e) => { setAdminKey(e.target.value); try { localStorage.setItem('admin_action_key', e.target.value); } catch (err) { console.warn('Could not persist admin_action_key', err); } }} className="mb-3" />
              <div className="flex gap-2">
                <Button onClick={async () => {
                  setChecking(true); setResult(null);
                  try {
                    if (!uid) throw new Error('UID required');
                    let claims: unknown = {};
                    try { claims = JSON.parse(claimsText); } catch (e) { throw new Error('Claims must be valid JSON'); }
                    const headers: Record<string, string> = {};
                    if (adminKey) headers['x-admin-action-key'] = adminKey;
                    const res = await api.post(`/admin/users/${encodeURIComponent(uid)}/claims`, { claims, reason }, { headers }) as unknown;
                    setResult(JSON.stringify(res, null, 2));
                  } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    setResult(errorMessage);
                  } finally { setChecking(false); }
                }} disabled={checking || !uid}>
                  {checking ? 'Working…' : 'Set Claims'}
                </Button>
                <Button variant="outline" onClick={() => { setUid(''); setClaimsText('{"admin":true}'); setReason(''); setResult(null); }}>Reset</Button>
              </div>
              {result && <pre className="mt-4 bg-gray-100 p-3 rounded text-sm">{result}</pre>}
            </GlowCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsers;
