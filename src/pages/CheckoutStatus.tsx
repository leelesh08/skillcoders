import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loading from '@/components/ui/Loading';
import ErrorMessage from '@/components/ui/ErrorMessage';
import GlowText from '@/components/GlowText';
import { api } from '@/lib/api';

const CheckoutStatus = () => {
  const [search] = useSearchParams();
  const sessionId = search.get('session_id') || search.get('sessionId') || undefined;
  const orderId = search.get('orderId') || search.get('order_id') || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfilled, setFulfilled] = useState<boolean>(false);
  const [details, setDetails] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  // PDF helpers: dynamically import pdf-lib only when needed
  const generatePdfFromOrder = async (orderData: any) => {
    // Only load pdf-lib when user actually needs to generate a PDF
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pageSize = [595, 842]; // A4-ish
    const margin = 40;

    const addPage = () => {
      const p = pdfDoc.addPage(pageSize);
      return p;
    };

    let page = addPage();
    const { width, height } = page.getSize();

    const drawHeader = (p: any) => {
      // simple colored logo box
      p.drawRectangle({ x: margin, y: height - margin - 40, width: 60, height: 30, color: rgb(0.15, 0.55, 0.9) });
      p.drawText('SkillCoders', { x: margin + 70, y: height - margin - 28, size: 16, font, color: rgb(0, 0, 0) });
      p.drawText('Invoice', { x: width - margin - 80, y: height - margin - 28, size: 14, font });
    };

    drawHeader(page);

    let y = height - margin - 80;

    page.drawText(`Order: ${orderData.orderId || orderData.id || ''}`, { x: margin, y, size: 12, font });
    y -= 18;
    page.drawText(`Title: ${orderData.title || ''}`, { x: margin, y, size: 12, font });
    y -= 18;
    page.drawText(`Amount: ₹${Number(orderData.amount || 0).toLocaleString()}`, { x: margin, y, size: 12, font });
    y -= 18;
    page.drawText(`Date: ${new Date(orderData.createdAt || Date.now()).toLocaleString()}`, { x: margin, y, size: 10, font });
    y -= 26;

    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      page.drawText('Items:', { x: margin, y, size: 12, font });
      y -= 18;
      for (const it of orderData.items) {
        const line = `${it.name || it.productId || ''} x${it.quantity || 1} - ₹${Number(it.price || 0).toLocaleString()}`;
        if (y < margin + 50) {
          page = addPage();
          drawHeader(page);
          y = height - margin - 80;
        }
        page.drawText(line, { x: margin + 10, y, size: 10, font });
        y -= 14;
      }
    }

    const bytes = await pdfDoc.save();
    return bytes;
  };

  const generatePdfFromSession = async (receipt: any) => {
    // Only load pdf-lib when user actually needs to generate a PDF
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const margin = 40;
    // header
    page.drawRectangle({ x: margin, y: height - margin - 40, width: 60, height: 30, color: rgb(0.15, 0.55, 0.9) });
    page.drawText('SkillCoders', { x: margin + 70, y: height - margin - 28, size: 16, font });
    page.drawText('Invoice', { x: width - margin - 80, y: height - margin - 28, size: 14, font });

    let y = height - margin - 80;
    page.drawText(`Order/Session: ${receipt.orderId || receipt.sessionId || ''}`, { x: margin, y, size: 12, font });
    y -= 18;
    page.drawText(`Item: ${receipt.itemName}`, { x: margin, y, size: 12, font });
    y -= 18;
    page.drawText(`Amount: ₹${Number(receipt.amount || 0).toLocaleString()}`, { x: margin, y, size: 12, font });

    const bytes = await pdfDoc.save();
    return bytes;
  };

  useEffect(() => {
    let mounted = true;
    let interval: number | null = null;
    const fetchStatus = async () => {
      try {
        setLoading(true);
        let orderRes = null;
        let sessionRes = null;
        if (orderId) {
          orderRes = await api.get(`/orders/${orderId}`).catch(() => null);
        }
        if ((sessionId && !orderRes) || !orderRes) {
          // try session lookup
          if (sessionId) {
            sessionRes = await api.get(`/session/${sessionId}`).catch(() => null);
          }
        }

        if (!mounted) return;

        const o = orderRes && orderRes.order ? orderRes.order : null;
        const s = sessionRes && sessionRes.session ? sessionRes.session : null;

        setDetails({ order: o, session: s });
        const isFulfilled = (o && o.fulfilled) || (s && s.payment_status === 'paid');
        if (isFulfilled) {
          setFulfilled(true);
          setLoading(false);
          if (interval) clearInterval(interval);
        } else {
          setFulfilled(false);
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        let em = '';
        if (err && typeof err === 'object' && 'message' in err) {
          const m = (err as { message?: unknown }).message;
          em = typeof m === 'string' ? m : String(m);
        } else {
          em = String(err);
        }
        setError(em || 'Unable to fetch status');
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };

    fetchStatus();
    interval = window.setInterval(fetchStatus, 5000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval as number);
    };
  }, [sessionId, orderId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Payment Status</h1>
            {loading && <Loading message="Checking payment status..." />}
            {error && <ErrorMessage message={error} />}
            {!loading && !error && (
              <div className="space-y-4">
                {fulfilled ? (
                  <div>
                    <h2 className="text-2xl font-semibold">Payment Successful</h2>
                    <p className="text-muted-foreground">Thank you — your order has been processed.</p>
                    {/* Show gadget/order specific details when available */}
                    {details && details.order ? (
                      <div className="mt-4 text-left">
                        <p className="text-sm text-muted-foreground">Order</p>
                        <p className="font-semibold">{details.order.title || details.order.itemId || details.order.orderId}</p>
                        <p className="text-sm text-muted-foreground mt-2">Amount</p>
                        <p className="font-medium">₹{Number(details.order.amount || 0).toLocaleString()}</p>
                        <pre className="text-xs bg-card p-3 rounded mt-3">{JSON.stringify(details.order, null, 2)}</pre>
                        <div className="mt-3 flex gap-2">
                          <button
                            className="px-3 py-2 rounded bg-primary text-primary-foreground"
                            onClick={async () => {
                              try {
                                setDownloading(true);
                                // Prefer server-side invoice when an orderId exists
                                const orderId = details.order.orderId || details.order.order_id || details.order.id;
                                const apiBase = import.meta.env.VITE_API_URL || '';
                                if (orderId) {
                                  const invoiceUrl = `${apiBase}/orders/${orderId}/invoice`;
                                  const resp = await fetch(invoiceUrl, { method: 'GET', credentials: 'include' });
                                  if (!resp.ok) throw new Error('Failed to download invoice');
                                  const blob = await resp.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `invoice_${orderId}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(url);
                                } else {
                                  // Fallback to client-side generation
                                  let orderData = details.order;
                                  const pdfBytes = await generatePdfFromOrder(orderData);
                                  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `invoice_${orderData.orderId || orderData.id || 'order'}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(url);
                                }
                              } finally {
                                setDownloading(false);
                              }
                            }}
                            disabled={downloading}
                          >
                            {downloading ? 'Downloading...' : 'Download Invoice'}
                          </button>
                        </div>
                      </div>
                    ) : details && details.session ? (
                      <div className="mt-4 text-left">
                        <p className="text-sm text-muted-foreground">Item</p>
                        <p className="font-semibold">
                          {details.session.line_items?.data?.[0]?.price?.product?.name || details.session.metadata?.itemId || 'Purchase'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Amount</p>
                        <p className="font-medium">₹{((details.session.amount_total || 0) / 100).toLocaleString()}</p>
                        <pre className="text-xs bg-card p-3 rounded mt-3">{JSON.stringify(details.session, null, 2)}</pre>
                        <div className="mt-3">
                          <button
                            className="px-3 py-2 rounded bg-primary text-primary-foreground"
                            onClick={async () => {
                              try {
                                setDownloading(true);
                                const session = details.session;
                                const orderIdFromSession = session.metadata?.orderId || null;
                                const apiBase = import.meta.env.VITE_API_URL || '';
                                if (orderIdFromSession) {
                                  const invoiceUrl = `${apiBase}/orders/${orderIdFromSession}/invoice`;
                                  const resp = await fetch(invoiceUrl, { method: 'GET', credentials: 'include' });
                                  if (!resp.ok) throw new Error('Failed to download invoice');
                                  const blob = await resp.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `invoice_${orderIdFromSession}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  URL.revokeObjectURL(url);
                                } else {
                                  // Fallback to client-side generation when server invoice not available
                                  const itemName = session.line_items?.data?.[0]?.price?.product?.name || session.metadata?.itemId || 'purchase';
                                  const amount = (session.amount_total || 0) / 100;
                                  const receipt = { orderId: session.metadata?.orderId || session.id, itemName, amount, sessionId: session.id, raw: session };
                                  const pdfBytes2 = await generatePdfFromSession(receipt);
                                  const blob2 = new Blob([pdfBytes2], { type: 'application/pdf' });
                                  const url2 = URL.createObjectURL(blob2);
                                  const a2 = document.createElement('a');
                                  a2.href = url2;
                                  a2.download = `invoice_${receipt.orderId || 'session'}.pdf`;
                                  document.body.appendChild(a2);
                                  a2.click();
                                  a2.remove();
                                  URL.revokeObjectURL(url2);
                                }
                              } finally {
                                setDownloading(false);
                              }
                            }}
                            disabled={downloading}
                          >
                            {downloading ? 'Downloading...' : 'Download Invoice'}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <Link to="/courses" className="text-primary hover:underline">
                      <GlowText as="span" color="gradient">Go to Courses</GlowText>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-medium">Payment Pending</h2>
                    <p className="text-muted-foreground">We are waiting for confirmation. This page will refresh automatically.</p>
                    <pre className="text-xs bg-card p-3 rounded mt-3">{JSON.stringify(details, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutStatus;
