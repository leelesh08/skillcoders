const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const ORDER_ID = process.env.ORDER_ID || 'e59fb154-f55a-44ba-8f43-3e13e152db6d';
const ordersFile = path.join(__dirname, '..', 'server', 'orders.json');

function loadOrders() {
  try {
    const raw = fs.readFileSync(ordersFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('Failed to read orders.json', e);
    process.exit(2);
  }
}

(async () => {
  const orders = loadOrders();
  const order = orders[ORDER_ID];
  if (!order) {
    console.error('Order not found:', ORDER_ID);
    process.exit(3);
  }

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageWidth = 595;
  const pageHeight = 842;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 60;

  // Optional logo
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes).catch(() => null);
      if (logoImage) {
        const lw = 120;
        const lh = (logoImage.height / logoImage.width) * lw;
        page.drawImage(logoImage, { x: 40, y: pageHeight - 40 - lh, width: lw, height: lh });
      }
    }
  } catch (e) {
    // ignore
  }

  page.drawText('Invoice', { x: 200, y: pageHeight - 50, size: 20, font: helvetica, color: rgb(0, 0, 0) });
  y -= 40;
  page.drawText(`Order ID: ${order.orderId}`, { x: 40, y, size: 12, font: helvetica });
  y -= 18;
  page.drawText(`User: ${order.userId || 'anonymous'}`, { x: 40, y, size: 12, font: helvetica });
  y -= 18;
  page.drawText(`Type: ${order.type || ''}`, { x: 40, y, size: 12, font: helvetica });
  y -= 18;
  page.drawText(`Created: ${order.createdAt || ''}`, { x: 40, y, size: 12, font: helvetica });
  y -= 24;

  page.drawText('Items', { x: 40, y, size: 14, font: helvetica });
  y -= 18;

  const drawLine = (text) => {
    if (y < 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 60;
    }
    page.drawText(text, { x: 50, y, size: 11, font: helvetica });
    y -= 16;
  };

  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((it, idx) => {
      drawLine(`${idx + 1}. ${it.name || it.productId || ''} x${it.quantity || 1} - ${it.price || ''}`);
    });
  } else if (order.title) {
    drawLine(order.title + (order.amount != null ? ` — ₹${order.amount}` : ''));
  }

  if (y < 120) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 100;
  } else {
    y -= 12;
  }
  const currencyLabel = (process.env.CURRENCY || 'INR').toUpperCase();
  page.drawText(`Total: ${order.amount != null ? `${order.amount} ${currencyLabel}` : '0'}`, { x: 40, y, size: 14, font: helvetica });

  const outDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `invoice-${ORDER_ID}.pdf`);

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log('Generated invoice at', outPath);
})();
