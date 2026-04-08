const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { URL } = require('url');

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '');
const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Escape user-supplied strings before embedding in HTML to prevent XSS in PDF
const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

// SSRF guard: only allow URLs that point to our own BASE_URL origin
function isSafeUrl(urlStr) {
  if (!urlStr) return false;
  if (urlStr.startsWith('data:')) return true;
  try {
    const base = new URL(process.env.BASE_URL || 'http://localhost:5000');
    const target = new URL(urlStr);
    // Must match same protocol and host — blocks redirects to internal IPs
    return target.protocol === base.protocol && target.host === base.host;
  } catch {
    return false;
  }
}

function getDataUri(urlStr, baseUrl) {
  if (!urlStr) return null;
  if (urlStr.startsWith('data:')) return urlStr;
  try {
    const base = new URL(baseUrl);
    const target = new URL(urlStr);
    if (target.protocol !== base.protocol || target.host !== base.host) return null;
    const filePath = path.join(__dirname, '..', target.pathname);
    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'gif'
            ? 'image/gif'
            : ext === 'svg'
              ? 'image/svg+xml'
              : 'application/octet-stream';
    return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch {
    return null;
  }
}

const safeUrl = (urlStr) => (isSafeUrl(urlStr) ? urlStr : null);

function buildHTML(loan, bank, categories, settings, baseUrl) {
  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c._id.toString()] = c.name;
  });

  const itemRows = loan.items
    .map(
      (item, i) => `
    <tr>
      <td>${i + 1}. ${escapeHtml(categoryMap[item.category_id?.toString()] || 'N/A')}</td>
      <td class="text-right">${escapeHtml(item.total_items || 1)}</td>
      <td class="text-right">${escapeHtml(item.gross_weight)} g</td>
      <td class="text-right">${escapeHtml(item.net_weight)} g</td>
      <td class="text-right">${escapeHtml(item.carat)}K</td>
      <td class="text-right currency">${formatCurrency(item.rate_per_gram)}</td>
      <td class="text-right currency">${formatCurrency(item.market_value)}</td>
    </tr>`
    )
    .join('');

  const imageGrid = (loan.images || [])
    .map((img, i) => {
      const imageSrc = getDataUri(img, baseUrl);
      if (!imageSrc) return '';
      return `
      <div class="img-cell">
        <img src="${imageSrc}" alt="Image ${i + 1}" />
        <p>Image ${i + 1}</p>
      </div>`;
    })
    .filter(Boolean)
    .join('');

  const safeLogo = bank.logo ? getDataUri(bank.logo, baseUrl) : null;
  const logoTag = safeLogo
    ? `<img src="${safeLogo}" alt="${escapeHtml(bank.name)} Logo" class="bank-logo" />`
    : '';

  const safeCompanyName = settings?.company_name ? escapeHtml(settings.company_name) : null;
  const safeCompanyLogo = settings?.logo ? getDataUri(settings.logo, baseUrl) : null;

  // Header uses company logo/name if set in settings, otherwise falls back to bank
  const headerLogo = safeCompanyLogo || safeLogo;
  const headerLogoTag = headerLogo
    ? `<img src="${headerLogo}" alt="Logo" class="bank-logo" />`
    : '';
  const headerTitle = safeCompanyName || escapeHtml(bank.name);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #222; background: #f4f4f4; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm; margin: 10mm auto; border: 1px solid #e0d8c7; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 18px rgba(0,0,0,0.08); }
  .page-break { page-break-before: always; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #b8860b; padding-bottom: 14px; margin-bottom: 18px; }
  .bank-logo { height: 70px; width: auto; margin-right: 18px; }
  .header-text h1 { font-size: 26px; color: #4a2f0d; margin-bottom: 4px; }
  .header-text h2 { font-size: 13px; color: #6b4a1b; font-weight: 600; letter-spacing: 0.03em; }
  .header-subtitle { font-size: 11px; color: #555; margin-top: 6px; }
  .section-title { background: #b8860b; color: white; padding: 6px 10px; font-size: 12px; margin: 18px 0 10px; border-radius: 6px; display: inline-block; }
  .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; margin-bottom: 14px; }
  .info-card { background: #fff8f0; border: 1px solid #f0e3d3; border-radius: 10px; padding: 12px 14px; }
  .info-row { display: flex; gap: 8px; margin-bottom: 4px; }
  .info-row:last-child { margin-bottom: 0; }
  .info-label { font-weight: 700; width: 135px; color: #664118; }
  .info-value { color: #3a2c20; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 0 0 1px #e6e0d6; }
  th, td { padding: 10px 12px; }
  th { background: #f5e4d2; color: #4a2f0d; font-size: 12px; text-align: left; border-bottom: 2px solid #d9c3a4; }
  td { border-bottom: 1px solid #eee; font-size: 11.5px; color: #3a2c20; }
  tr:nth-child(even) td { background: #fbf6f1; }
  .text-right { text-align: right; }
  .currency { white-space: nowrap; }
  .totals { margin-top: 18px; display: flex; justify-content: flex-end; }
  .totals table { width: 340px; border: 1px solid #e7d5bd; border-radius: 10px; overflow: hidden; }
  .totals td { border: none; padding: 12px 14px; font-size: 12px; }
  .totals tr:nth-child(odd) { background: #faf3eb; }
  .totals tr:nth-child(even) { background: #fff7ed; }
  .totals .label { color: #6b4a1b; font-weight: 600; }
  .totals .value { color: #222; text-align: right; }
  .totals .highlight { background: #4a2f0d; color: white; font-weight: 700; }
  .notes { margin-top: 14px; font-size: 10.5px; color: #5f4a37; line-height: 1.4; }
  .signatures { display: flex; justify-content: space-between; gap: 12px; margin-top: 32px; }
  .sig-box { text-align: center; width: 30%; padding-top: 12px; }
  .sig-line { border-top: 1px solid #8c7a69; margin-bottom: 6px; }
  .sig-box p { font-size: 10.5px; color: #5f4a37; margin-top: 6px; }
  .img-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
  .img-cell { border: 1px solid #e7d5bd; border-radius: 10px; overflow: hidden; background: #fff; }
  .img-cell img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
  .img-cell p { margin: 10px 0 8px; color: #4a2f0d; font-size: 11px; font-weight: 600; }
  .memo-no { font-size: 11px; color: #6b4a1b; margin-top: 6px; letter-spacing: 0.01em; }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="header">
    ${headerLogoTag}
    <div class="header-text">
      <h1>${headerTitle}</h1>
      <h2>Gold Appraisal Memo</h2>
      <div class="memo-no">Memo No: GL-${Date.now()} &nbsp;|&nbsp; Date: ${formatDate(new Date())}</div>
    </div>
  </div>

  <div class="section-title">Customer Details</div>
  <div class="info-grid">
    <div class="info-card">
      <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${escapeHtml(loan.full_name)}</span></div>
      <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">${formatDate(loan.dob)}</span></div>
      <div class="info-row"><span class="info-label">Mobile:</span><span class="info-value">${escapeHtml(loan.mobile)}</span></div>
      <div class="info-row"><span class="info-label">Account Number:</span><span class="info-value">${escapeHtml(loan.account_number)}</span></div>
    </div>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${escapeHtml(loan.address)}</span></div>
      <div class="info-row"><span class="info-label">Nominee Name:</span><span class="info-value">${escapeHtml(loan.nominee_name)}</span></div>
      <div class="info-row"><span class="info-label">Nominee DOB:</span><span class="info-value">${formatDate(loan.nominee_dob)}</span></div>
      <div class="info-row"><span class="info-label">Bank:</span><span class="info-value">${escapeHtml(bank.name)}</span></div>
    </div>
  </div>

  <div class="section-title">Gold Items</div>
  <table>
    <thead>
      <tr>
        <th>Item / Category</th>
        <th>Total Items</th>
        <th>Gross Weight</th>
        <th>Net Weight</th>
        <th>Carat</th>
        <th class="text-right">Rate / g</th>
        <th class="text-right">Market Value</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td class="label">Total Items</td><td class="value">${loan.total_items || 0}</td></tr>
      <tr><td class="label">Total Market Value</td><td class="value currency">${formatCurrency(loan.total_market_value)}</td></tr>
      <tr class="highlight"><td class="label">Loan Value (75%)</td><td class="value currency">${formatCurrency(loan.loan_value)}</td></tr>
    </table>
  </div>

  <div class="notes">
    Note: Loan value is calculated as 75% of the total market value of pledged gold items. Please verify all item details and uploaded photographs.
  </div>

  <div class="signatures">
    <div class="sig-box"><div class="sig-line"></div><p>Appraiser Signature</p></div>
    <div class="sig-box"><div class="sig-line"></div><p>Customer Signature</p></div>
    <div class="sig-box"><div class="sig-line"></div><p>Authorised Signatory</p></div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page page-break">
  <div class="header">
    ${headerLogoTag}
    <div class="header-text">
      <h1>${headerTitle}</h1>
      <h2>Gold Item Images</h2>
    </div>
  </div>
  <div class="section-title">PLEDGED GOLD ITEM PHOTOGRAPHS</div>
  <div class="img-grid">
    ${imageGrid || '<p style="color:#999;margin-top:10px;">No images uploaded.</p>'}
  </div>
</div>

</body>
</html>`;
}

async function generatePDF(loan, bank, categories, settings = null) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const html = buildHTML(loan, bank, categories, settings, baseUrl);
  const filename = `loan_${loan._id}_${randomUUID()}.pdf`;
  const outputPath = path.join(__dirname, '../uploads/pdf', filename);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Block Puppeteer from making requests to anything outside our own origin
    const base = new URL(process.env.BASE_URL || 'http://localhost:5000');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      try {
        const reqUrl = new URL(req.url());
        // Allow data URIs and same-origin requests only
        if (req.url().startsWith('data:') || reqUrl.host === base.host) {
          req.continue();
        } else {
          req.abort();
        }
      } catch {
        req.abort();
      }
    });

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await browser.close();
  }

  return `/uploads/pdf/${filename}`;
}

module.exports = { generatePDF };
