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

interface Quiz {
  id: string;
  title?: string;
  name?: string;
  questions?: Array<{ id: string }>;
}

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const adminKey = (() => { try { return localStorage.getItem('admin_action_key') || ''; } catch { return ''; } })();

  useEffect(() => {
    let mounted = true;
    api.get('/api/quizzes').then((data: Quiz[] | Record<string, Quiz>) => {
      if (!mounted) return;
      setQuizzes(Array.isArray(data) ? data : Object.values(data || {}));
    }).catch((e) => setError(String(e))).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading message="Loading quizzes..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Admin — Quizzes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <GlowCard key={q.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{q.title || q.name}</div>
                    <div className="text-sm text-muted-foreground">Questions: {q.questions?.length || 0}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing(q)}>Edit</Button>
                    <GlowButton onClick={async () => {
                      await api.delete(`/api/quizzes/${q.id}`, { headers: { 'x-admin-action-key': adminKey } }).catch(() => null);
                      setQuizzes((prev) => prev.filter((x) => String(x.id) !== String(q.id)));
                    }}>Delete</GlowButton>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
          <div className="mt-6">
            <GlowCard className="p-4">
              <h3 className="font-semibold mb-2">{editing ? 'Edit Quiz' : 'Create Quiz'}</h3>
              <div className="space-y-2">
                <label className="block text-sm">ID</label>
                <Input value={editing?.id || ''} onChange={(e) => setEditing((s) => s ? { ...s, id: e.target.value } : { id: e.target.value })} />
                <label className="block text-sm">Title</label>
                <Input value={editing?.title || ''} onChange={(e) => setEditing((s) => s ? { ...s, title: e.target.value } : { id: '', title: e.target.value })} />
                <label className="block text-sm">Questions (JSON array)</label>
                <textarea rows={6} placeholder="Enter questions as JSON array" value={JSON.stringify(editing?.questions || [], null, 2)} onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditing((s) => s ? { ...s, questions: parsed } : null);
                  } catch {
                    // ignore parse errors until save
                  }
                }} className="w-full p-2 border rounded" />
                <div className="flex gap-2 mt-3">
                  <Button onClick={async () => {
                    setSaving(true);
                    try {
                      if (!editing) return;
                      if (editing.id) {
                        const res = await api.put(`/api/quizzes/${encodeURIComponent(editing.id)}`, editing, { headers: { 'x-admin-action-key': adminKey } });
                        setQuizzes((prev) => prev.map((p) => String(p.id) === String(editing.id) ? res : p));
                      } else {
                        const res = await api.post('/api/quizzes', editing, { headers: { 'x-admin-action-key': adminKey } });
                        setQuizzes((prev) => prev ? [ ...prev, res ] : [res]);
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

export default AdminQuizzes;
