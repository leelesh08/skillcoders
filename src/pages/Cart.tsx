import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function Cart() {
  const { items, remove, updateQty, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // create items format expected by backend
      const payload = {
        type: 'cart',
        items: items.map((it) => ({ productId: it.id, name: it.title, price: Number(it.price), quantity: it.quantity || 1 })),
      };
      const res = await api.post('/checkout', payload);
      // handle mock responses
      const body = res as { orderId?: string; sessionId?: string; url?: string };
      if (body && body.orderId) {
        // If mock mode in dev, simulate webhook so status becomes fulfilled immediately
        if (import.meta.env.DEV) {
          try {
            await api.post('/webhook', { type: 'checkout.session.completed', data: { object: { id: body.sessionId || null, metadata: { orderId: body.orderId } } } });
          } catch (e) {
            // ignore webhook simulation failures
          }
        }
        navigate(`/checkout/status?orderId=${encodeURIComponent(body.orderId)}`);
        return;
      }
      if (body && body.sessionId) {
        // auto-simulate mock stripe sessions in dev
        if (import.meta.env.DEV && String(body.sessionId).startsWith('cs_mock_')) {
          try {
            await api.post('/webhook', { type: 'checkout.session.completed', data: { object: { id: body.sessionId, metadata: { orderId: body.orderId } } } });
          } catch (e) {
            // ignore webhook simulation failures
          }
          navigate(`/checkout/status?session_id=${encodeURIComponent(body.sessionId)}`);
          return;
        }
        navigate(`/checkout/status?session_id=${encodeURIComponent(body.sessionId)}`);
        return;
      }
      if (body && body.url) {
        // If backend returned a mock URL containing orderId, and we're in dev, try to simulate
        if (import.meta.env.DEV) {
          try {
            const parsed = new URL(body.url, window.location.origin);
            const oid = parsed.searchParams.get('orderId');
            if (oid) await api.post('/webhook', { type: 'checkout.session.completed', data: { object: { id: body.sessionId || null, metadata: { orderId: oid } } } });
          } catch (e) {
            // ignore webhook simulation failures
          }
        }
        window.location.href = body.url;
        return;
      }
      alert('Checkout started');
    } catch (e) {
      alert(String(e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Cart</h2>
            <div className="flex items-center gap-2">
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {items.length === 0 && <div className="text-muted-foreground">Your cart is empty.</div>}
              {items.map((it) => (
                <div key={String(it.id)} className="p-4 mb-4 bg-card rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{it.title}</div>
                      <div className="text-sm text-muted-foreground">{(it.price ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input className="w-16 p-1 border rounded text-center text-black" type="number" min={1} value={it.quantity ?? 1} onChange={(e) => updateQty(it.id, Number(e.target.value))} />
                      <Button size="sm" variant="destructive" onClick={() => remove(it.id)}>Remove</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="p-4 bg-card rounded">
                <div className="text-sm text-muted-foreground">Subtotal</div>
                <div className="text-2xl font-bold my-3">{subtotal.toLocaleString()}</div>
                <div className="flex gap-2">
                  <Button onClick={handleCheckout} disabled={items.length === 0 || processing}>{processing ? 'Processing...' : 'Checkout'}</Button>
                  <Button variant="outline" onClick={() => clear()}>Clear</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
