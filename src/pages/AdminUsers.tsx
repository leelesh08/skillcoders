import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { onIdTokenChanged, getIdTokenResult } from 'firebase/auth';

const AdminUsers = () => {
  const [uid, setUid] = useState('');
  const [claimsText, setClaimsText] = useState('{"admin":true}');
  const [reason, setReason] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!mounted) return;
      if (!user) {
        setChecking(false);
        navigate('/');
        return;
      }
      try {
        const tokenResult = await getIdTokenResult(user);
        const claims = (tokenResult && (tokenResult.claims as any)) || {};
        const isAdmin = Boolean(claims.admin || (claims.roles && claims.roles.includes && claims.roles.includes('admin')));
        if (!isAdmin) {
          setChecking(false);
          navigate('/');
          return;
        }
        setChecking(false);
      } catch (e) {
        setChecking(false);
        navigate('/');
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [navigate]);

  const handleSetClaims = async () => {
    setResult(null);
    setLoading(true);
    try {
      const claims = JSON.parse(claimsText);
      const headers: Record<string, string> = {};
      if (adminKey) headers['x-admin-action-key'] = adminKey;
      const res = await api.post(`/admin/users/${uid}/claims`, { claims, reason }, { headers });
      setResult(JSON.stringify(res));
    } catch (err: any) {
      setResult(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin — Manage User Claims</h2>
      <label className="block mb-2">Target UID</label>
      <input value={uid} onChange={(e) => setUid(e.target.value)} className="w-full mb-4 p-2 border rounded" />

      <label className="block mb-2">Claims (JSON)</label>
      <textarea value={claimsText} onChange={(e) => setClaimsText(e.target.value)} rows={4} className="w-full mb-4 p-2 border rounded" />

      <label className="block mb-2">Reason (optional)</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full mb-4 p-2 border rounded" />

      <label className="block mb-2">Admin Action Key (if required)</label>
      <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} className="w-full mb-4 p-2 border rounded" />

      {checking ? (
        <div className="p-6">Checking permissions…</div>
      ) : (
        <div className="flex gap-2">
        <button onClick={handleSetClaims} disabled={loading || !uid} className="px-4 py-2 bg-primary text-white rounded">
          {loading ? 'Working…' : 'Set Claims'}
        </button>
        </div>
      )}

      {result && (
        <pre className="mt-4 bg-gray-100 p-3 rounded text-sm">{result}</pre>
      )}
    </div>
  );
};

export default AdminUsers;
