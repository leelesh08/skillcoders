import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, onIdTokenChanged, getIdTokenResult } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import { api } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';

type Course = {
  id: string;
  title: string;
  instructor?: string;
  rating?: number;
  students?: number;
  duration?: string;
  price?: number;
  image?: string;
  level?: string;
  category?: string;
};

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const unsub = onIdTokenChanged(auth, async (user) => {
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

      // load courses once authorized
      setLoading(true);
      api
        .get('/courses')
        .then((data: unknown) => {
          if (!mounted) return;
          setCourses(Array.isArray(data) ? (data as Course[]) : []);
        })
        .catch((err: unknown) => {
          if (!mounted) return;
          setError(String(err));
        })
        .finally(() => {
          if (!mounted) return;
          setLoading(false);
        });
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [navigate]);

  const startAdd = () => setEditing({ id: '', title: '', price: 0 } as Course);
  const startEdit = (c: Course) => setEditing({ ...c });
  const adminKey = (() => { try { return localStorage.getItem('admin_action_key') || ''; } catch { return ''; } })();

  const saveCourse = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // upsert single course
      const res = await api.post('/courses', editing, { headers: { 'x-admin-action-key': adminKey } });
      if (res && (res as any).courses) setCourses((res as any).courses);
      else if ((res as any).course) {
        // server returns course and courses
        setCourses((res as any).courses || []);
      }
      setEditing(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!courses) return;
    const remaining = courses.filter((c) => String(c.id) !== String(id));
    setSaving(true);
    try {
      const res = await api.post('/courses', remaining, { headers: { 'x-admin-action-key': adminKey } });
      setCourses(Array.isArray(res) ? (res as Course[]) : (res as any).courses || remaining);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading courses..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Admin — Courses</h2>
            <div className="flex gap-2">
              <Button onClick={startAdd}>Add Course</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              {courses && courses.length === 0 && <div className="text-muted-foreground">No courses</div>}
              {courses && courses.map((c) => (
                <GlowCard key={c.id} className="p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{c.title}</div>
                      <div className="text-sm text-muted-foreground">{c.instructor} • ₹{c.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEdit(c)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCourse(String(c.id))} disabled={saving}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>

            <div>
              {editing ? (
                <GlowCard className="p-4">
                  <h3 className="font-semibold mb-2">{editing.id ? 'Edit Course' : 'Add Course'}</h3>
                  <div className="space-y-2">
                    <label className="block text-sm">ID</label>
                    <Input value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} />
                    <label className="block text-sm">Title</label>
                    <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    <label className="block text-sm">Instructor</label>
                    <Input value={editing.instructor || ''} onChange={(e) => setEditing({ ...editing, instructor: e.target.value })} />
                    <label className="block text-sm">Price</label>
                    <Input type="number" value={String(editing.price ?? 0)} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                    <label className="block text-sm">Duration</label>
                    <Input value={editing.duration || ''} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
                    <label className="block text-sm">Category</label>
                    <Input value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                    <div className="flex gap-2 mt-3">
                      <Button onClick={saveCourse} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                      <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                </GlowCard>
              ) : (
                <div className="text-muted-foreground">Select a course to edit or click "Add Course".</div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCourses;
