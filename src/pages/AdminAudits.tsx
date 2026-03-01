import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';

type Audit = {
  timestamp: string;
  orderId: string;
  actor: string;
  authMethod: string;
  ip?: string;
  userAgent?: string;
  route?: string;
  method?: string;
};

const AdminAudits: React.FC = () => {
  const [items, setItems] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const apiBase = import.meta.env.VITE_API_URL || '';

  const fetchAudits = async (useKey = false) => {
    setLoading(true);
    setError(null);
    try {
      // Try using authenticated api wrapper first
      if (!useKey) {
        const res = await api.get(`/admin/invoice-audits?limit=${limit}&offset=${offset}`);
        setItems(res && Array.isArray(res.items) ? res.items : []);
        setLoading(false);
        return;
      }

      // Fallback: use x-admin-action-key header
      const url = `${apiBase}/admin/invoice-audits?limit=${limit}&offset=${offset}`;
      const resp = await fetch(url, { headers: { 'x-admin-action-key': adminKey }, credentials: 'include' });
      if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
      const body = await resp.json();
      setItems(body.items || []);
      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      let msg = '';
      if (err && typeof err === 'object' && 'message' in err) msg = String((err as Record<string, unknown>).message);
      else msg = String(err || 'Failed to fetch audits');
      setError(msg);
    }
  };

  useEffect(() => {
    fetchAudits(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Invoice Audit Logs</h1>
          <p className="text-sm text-muted-foreground mb-4">Admin-only view of invoice download audit entries.</p>

          <div className="flex gap-2 mb-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Limit</span>
              <input type="number" value={limit} onChange={(e) => setLimit(Math.min(1000, Math.max(1, Number(e.target.value || 100))))} className="ml-2 input" />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Offset</span>
              <input type="number" value={offset} onChange={(e) => setOffset(Math.max(0, Number(e.target.value || 0)))} className="ml-2 input" />
            </label>
            <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={() => fetchAudits(false)}>Refresh</button>
          </div>

          {loading && <Loading message="Loading audits..." />}
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} />
              <div className="mt-2 flex gap-2">
                <input placeholder="Admin action key" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="input" />
                <button className="px-3 py-2 rounded bg-secondary text-secondary-foreground" onClick={() => fetchAudits(true)}>Retry with key</button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto bg-card rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Order</th>
                    <th className="p-2">Actor</th>
                    <th className="p-2">Auth</th>
                    <th className="p-2">IP</th>
                    <th className="p-2">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 align-top">{new Date(it.timestamp).toLocaleString()}</td>
                      <td className="p-2 align-top">{it.orderId}</td>
                      <td className="p-2 align-top">{it.actor}</td>
                      <td className="p-2 align-top">{it.authMethod}</td>
                      <td className="p-2 align-top break-words max-w-xs">{it.ip}</td>
                      <td className="p-2 align-top break-words max-w-xl">{it.userAgent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminAudits;
