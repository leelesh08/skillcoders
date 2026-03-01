import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import GlowButton from '@/components/GlowButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Battle {
  id: string;
  title?: string;
  name?: string;
  prize: string | number;
}

interface EditingBattle extends Battle {
  entryFee?: number;
  creator?: string;
}

const AdminBattles = () => {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingBattle | null>(null);
  const [saving, setSaving] = useState(false);
  const adminKey = (() => { try { return localStorage.getItem('admin_action_key') || ''; } catch { return ''; } })();

  useEffect(() => {
    let mounted = true;
    api.get('/battles/active').then((data: Battle[] | Record<string, Battle>) => {
      if (!mounted) return;
      setBattles(Array.isArray(data) ? data : Object.values(data || {}));
    }).catch((e) => setError(String(e))).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading message="Loading battles..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Admin — Battles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {battles.map((b) => (
              <GlowCard key={b.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{b.title || b.name}</div>
                    <div className="text-sm text-muted-foreground">Prize: {b.prize}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing({ ...b })}>Edit</Button>
                    <GlowButton onClick={async () => {
                      await api.put(`/battles/${b.id}/fulfill`, {}, { headers: { 'x-admin-action-key': adminKey } }).catch(() => null);
                    }}>Fulfill</GlowButton>
                    <GlowButton variant="secondary" onClick={async () => {
                      await api.delete(`/battles/${b.id}`, { headers: { 'x-admin-action-key': adminKey } }).catch(() => null);
                      setBattles((prev) => prev.filter((x) => String(x.id) !== String(b.id)));
                    }}>Delete</GlowButton>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
          <div className="mt-6">
            <GlowCard className="p-4">
              <h3 className="font-semibold mb-2">{editing ? 'Edit Battle' : 'Create Battle'}</h3>
              <div className="grid gap-2">
                <label className="text-sm">Title</label>
                <Input value={editing?.title || ''} onChange={(e) => setEditing((s)=>({ ...(s||{}), title: e.target.value } as EditingBattle))} />
                <label className="text-sm">Prize</label>
                <Input type="number" value={String(editing?.prize ?? '')} onChange={(e) => setEditing((s)=>({ ...(s||{}), prize: Number(e.target.value) } as EditingBattle))} />
                <label className="text-sm">Entry Fee</label>
                <Input type="number" value={String(editing?.entryFee ?? '')} onChange={(e) => setEditing((s)=>({ ...(s||{}), entryFee: Number(e.target.value) } as EditingBattle))} />
                <label className="text-sm">Creator</label>
                <Input value={editing?.creator || ''} onChange={(e) => setEditing((s)=>({ ...(s||{}), creator: e.target.value } as EditingBattle))} />
                <div className="flex gap-2 mt-3">
                  <Button onClick={async () => {
                    setSaving(true);
                    try {
                      if (!editing) return;
                      if (editing.id) {
                        const res = await api.put(`/battles/${encodeURIComponent(editing.id)}`, editing, { headers: { 'x-admin-action-key': adminKey } });
                        setBattles((prev) => prev.map((p) => String(p.id) === String(editing.id) ? res : p));
                      } else {
                        const res = await api.post('/battles', editing, { headers: { 'x-admin-action-key': adminKey } });
                        setBattles((prev) => prev ? [ ...(prev as Battle[]), res ] : [res]);
                      }
                      setEditing(null);
                    } catch (e) {
                      setError(String(e));
                    } finally { setSaving(false); }
                  }} disabled={saving}>{saving ? 'Saving…' : (editing?.id ? 'Save' : 'Create')}</Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            </GlowCard>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminBattles;
