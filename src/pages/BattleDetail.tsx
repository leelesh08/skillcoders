import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import GlowButton from '@/components/GlowButton';
import { api } from '@/lib/api';

const BattleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  type Battle = {
    id: string | number;
    title?: string;
    creator?: string;
    prize?: number;
    entryFee?: number;
    viewers?: number;
  };

  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>(() => localStorage.getItem('username') || '');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/battles/${id}`);
        if (!mounted) return;
        setBattle(res);
      } catch (e: unknown) {
        if (!mounted) return;
        try {
          setError((e as Error).message || String(e));
        } catch {
          setError(String(e));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const join = async () => {
    if (!username) {
      alert('Please set a username first');
      return;
    }
    localStorage.setItem('username', username);
    try {
      const res = await api.post(`/battles/${id}/join`, { username });
      setBattle(res);
      // redirect to main battle page where checkout flow can be started
      navigate('/battle');
    } catch (e: unknown) {
      try {
        alert((e as Error).message || String(e));
      } catch {
        alert(String(e));
      }
    }
  };

  if (loading) return <Loading message="Loading battle..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!battle) return <ErrorMessage message="Battle not found" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-card p-6 rounded">
            <h1 className="text-2xl font-bold mb-2">{battle.title}</h1>
            <p className="text-sm text-muted-foreground mb-2">Creator: {battle.creator}</p>
            <p className="mb-2">Prize: ₹{(battle.prize || 0).toLocaleString()}</p>
            <p className="mb-4">Entry Fee: ₹{(battle.entryFee || 0).toLocaleString()}</p>
            <p className="mb-4">Viewers: {battle.viewers || 0}</p>
            <label className="text-sm">Your username</label>
            <input className="w-full p-2 border rounded mb-4" value={username} onChange={(e) => setUsername(e.target.value)} />
            <div className="flex gap-3">
              <GlowButton variant="outline" onClick={() => navigate(-1)}>Back</GlowButton>
              <GlowButton variant="primary" onClick={join}>Join Battle</GlowButton>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BattleDetail;
