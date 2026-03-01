import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowCard from '@/components/GlowCard';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import GlowButton from '@/components/GlowButton';

interface InstructorApplication {
  id: string;
  uid?: string;
  name?: string;
  email: string;
  createdAt?: string;
  date?: string;
}

const AdminInstructors = () => {
  const [apps, setApps] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.get('/instructor_applications').then((data: InstructorApplication[] | Record<string, InstructorApplication>) => {
      if (!mounted) return;
      setApps(Array.isArray(data) ? data : Object.values(data || {}));
    }).catch((e) => setError(String(e))).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading message="Loading instructor applications..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-6">Admin — Instructors</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {apps.map((a) => (
              <GlowCard key={a.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{a.name || a.email}</div>
                    <div className="text-sm text-muted-foreground">Applied: {a.createdAt || a.date || 'unknown'}</div>
                  </div>
                  <div className="flex gap-2">
                    <GlowButton onClick={async () => {
                      // approve placeholder: set as instructor role via admin API
                      const adminKey = localStorage.getItem('admin_action_key') || '';
                      await api.post(`/admin/users/${encodeURIComponent(a.uid || a.id)}/claims`, { claims: { instructor: true }, reason: 'approved' }, { headers: { 'x-admin-action-key': adminKey } }).catch(() => null);
                    }}>Approve</GlowButton>
                    <GlowButton onClick={async () => {
                      await api.delete(`/instructor_applications/${a.id}`, { headers: { 'x-admin-action-key': localStorage.getItem('admin_action_key') || '' } }).catch(() => null);
                    }}>Reject</GlowButton>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminInstructors;
