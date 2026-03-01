import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlowButton from '@/components/GlowButton';

const MockCheckout = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = search.get('session_id') || search.get('sessionId') || '';
  const orderId = search.get('orderId') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // nothing for now
  }, []);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4242';

  const completePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            metadata: { orderId, userId: 'mock-user' },
          },
        },
      };

      const resp = await fetch(`${apiBase}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        throw new Error(`Webhook failed: ${resp.status} ${body}`);
      }

      // Redirect to checkout status page (uses orderId)
      navigate(`/checkout/status?orderId=${encodeURIComponent(orderId)}`);
    } catch (err: unknown) {
      let msg = 'Failed to complete mock payment';
      if (err && typeof err === 'object' && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        msg = typeof m === 'string' ? m : String(m);
      } else {
        msg = String(err);
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-xl">
          <div className="bg-card p-8 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Mock Checkout</h1>
            <p className="text-sm text-muted-foreground mb-4">Session: {sessionId || '—'}</p>
            <p className="text-sm text-muted-foreground mb-6">Order: {orderId || '—'}</p>
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <div className="flex gap-3 justify-center">
              <GlowButton variant="outline" onClick={() => navigate(-1)}>Cancel</GlowButton>
              <GlowButton variant="primary" onClick={completePayment} disabled={loading || !orderId || !sessionId}>
                {loading ? 'Processing…' : 'Complete Mock Payment'}
              </GlowButton>
            </div>
            <p className="text-xs text-muted-foreground mt-4">This page simulates a Stripe checkout for local development.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MockCheckout;
