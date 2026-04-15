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
    // Map URL pathname to filesystem path
    let filePath;
    if (process.env.NODE_ENV === 'production') {
      // /cloud/images/x.jpg  → /app/cloud/images/x.jpg
      // /cloud/documents/x.pdf → /app/cloud/documents/x.pdf
      filePath = path.join('/app', target.pathname);
    } else {
      filePath = path.join(__dirname, '..', target.pathname);
    }
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
    .map((item, i) => {
      // Handle both populated and non-populated category_id
      let categoryName = 'N/A';
      if (item.category_id) {
        if (typeof item.category_id === 'object' && item.category_id.name) {
          // Already populated
          categoryName = item.category_id.name;
        } else {
          // String ID - lookup in categoryMap
          const catId = typeof item.category_id === 'string' ? item.category_id : item.category_id.toString();
          categoryName = categoryMap[catId] || 'N/A';
        }
      }
      
      // Add quantity in parentheses if total_items > 1
      const quantity = item.total_items || 1;
      const displayName = quantity > 1 ? `${categoryName} (${quantity})` : categoryName;
      
      return `
      <tr>
        <td class="no">${i + 1}</td>
        <td class="desc">${escapeHtml(displayName)}</td>
        <td>${escapeHtml(item.gross_weight)}</td>
        <td>${escapeHtml(item.net_weight)}</td>
        <td>${escapeHtml(item.carat)}</td>
        <td>${escapeHtml(item.rate_per_gram)}</td>
        <td>${formatCurrency(item.market_value)}</td>
      </tr>`;
    })
    .join('');

  const safeLogo = bank.logo ? getDataUri(bank.logo, baseUrl) : null;
  const logoTag = safeLogo
    ? `<img src="${safeLogo}" alt="${escapeHtml(bank.name)} Logo" style="width:auto;height:70px;max-width:80px;border-radius:4px;object-fit:contain;" />`
    : `<div style="width:52px;height:52px;background:#cc2a2a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:22px;">${escapeHtml(bank.name.charAt(0))}</div>`;

  const totalGrossWeight = loan.items.reduce((sum, item) => sum + Number(item.gross_weight || 0), 0).toFixed(2);
  const totalNetWeight = loan.items.reduce((sum, item) => sum + Number(item.net_weight || 0), 0).toFixed(2);
  const totalMarketValue = loan.total_market_value || 0;
  const marketValueForGoldPercent = loan.market_value_for_gold || 100;
  const goldPurity = loan.gold_purity || '';
  const ltvPercent = loan.ltv || 75;
  const maxAllowableLoan = totalMarketValue * (ltvPercent / 100);
  const advancedValueType = loan.advanced_value_type || 0;
  const advancedValueNorms = Number(totalNetWeight) * Number(advancedValueType);
  const maxPermissibleLimit = loan.max_permissible_limit || 0;
  const finalAmount = loan.final_amount || 0;
  const accountBoxes = (loan.account_number || '').split('').map(char => `<div class="box">${escapeHtml(char)}</div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(bank.name)} – Gold Re Appraisal Memo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #d6cfc4; font-family: 'Libre Franklin', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 32px 16px; }
    .page { background: #faf8f3; width: 760px; padding: 28px 32px 36px; border: 1px solid #bbb; box-shadow: 0 4px 24px rgba(0,0,0,0.18); print-color-adjust: exact; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 14px; }
    .logo-block { display: flex; align-items: center; gap: 10px; }
    .logo-text-block { }
    .logo-english { font-size: 13px; font-weight: 700; color: #222; }
    .logo-tagline { font-size: 9px; color: #555; letter-spacing: 0.4px; }
    .header-right { text-align: right; }
    .memo-title { font-size: 18px; font-weight: 700; color: #111; letter-spacing: 0.3px; }
    .fields-row { display: flex; gap: 24px; margin-bottom: 14px; font-size: 12px; color: #222; }
    .field-line { display: flex; align-items: center; gap: 6px; flex: 1; }
    .field-line label { font-weight: 600; white-space: nowrap; }
    .field-line .underline { flex: 1; border-bottom: 1px solid #555; min-height: 18px; }
    .acno-boxes { display: flex; gap: 2px; }
    .acno-boxes .box { width: 20px; height: 20px; border: 1px solid #555; display: flex; align-items: center; justify-content: center; font-size: 10px; }
    table.main { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 14px; }
    table.main th, table.main td { border: 1px solid #444; padding: 4px 6px; text-align: center; vertical-align: middle; }
    table.main thead tr th { background: #e8e0d0; font-weight: 700; font-size: 11px; color: #111; }
    table.main tbody td.desc { text-align: left; }
    table.main tbody td.no { font-weight: 600; }
    table.main tfoot td { font-weight: 700; background: #e8e0d0; font-size: 12px; }
    .mv-section { font-size: 11.5px; color: #111; margin-bottom: 10px; line-height: 2.0; }
    .mv-section .line { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
    .mv-section .underline { border-bottom: 1px solid #555; min-width: 80px; display: inline-block; padding: 0 4px; }
    .mv-section .underline-lg { border-bottom: 1px solid #555; min-width: 160px; display: inline-block; padding: 0 4px; }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 14px; font-size: 11.5px; }
    .sign-line { display: flex; align-items: flex-end; gap: 6px; }
    .sign-line label { font-weight: 600; white-space: nowrap; }
    .sign-line .underline { flex:1; border-bottom: 1px solid #555; }
    .loan-amount-box { padding: 10px 0; margin-bottom: 14px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 11.5px; }
    .loan-amount-box .label-box { font-family: 'Noto Sans Gujarati', sans-serif; font-weight: 600; }
    .loan-amount-box .underline { border-bottom: 1px solid #555; min-width: 200px; display: inline-block; min-height: 20px; }
    .cert-title { text-align: center; font-size: 14px; font-weight: 700; text-decoration: underline; margin-bottom: 8px; }
    .cert-text { font-size: 11px; line-height: 1.7; color: #111; margin-bottom: 8px; }
    .footer-row { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-weight: 600; border-top: 1px solid #888; padding-top: 8px; }
    @media print { body { background: none; padding: 0; } .page { box-shadow: none; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-block">
      ${logoTag}
      <div class="logo-text-block">
        <div class="logo-english">${escapeHtml(bank.name)}</div>
        <div class="logo-tagline">India's International Bank</div>
      </div>
    </div>
    <div class="header-right">
      <div class="memo-title">Gold Re Appraisal Memo</div>
    </div>
  </div>
  <div class="fields-row">
    <div class="field-line">
      <label>Name :</label>
      <div class="underline">${escapeHtml(loan.full_name)}</div>
    </div>
    <div class="field-line">
      <label>DOB :</label>
      <div class="underline">${formatDate(loan.dob)}</div>
    </div>
  </div>
  <div class="fields-row">
    <div class="field-line" style="flex:none;">
      <label>A/c No. :</label>
      <div class="acno-boxes">${accountBoxes}</div>
    </div>
    <div class="field-line">
      <label>Mobile :</label>
      <div class="underline">${escapeHtml(loan.mobile)}</div>
    </div>
  </div>
  <div class="fields-row">
    <div class="field-line">
      <label>Address :</label>
      <div class="underline">${escapeHtml(loan.address)}</div>
    </div>
  </div>
  <div class="fields-row">
    <div class="field-line">
      <label>Nominee Name :</label>
      <div class="underline">${escapeHtml(loan.nominee_name)}</div>
    </div>
    <div class="field-line">
      <label>Nominee DOB :</label>
      <div class="underline">${formatDate(loan.nominee_dob)}</div>
    </div>
  </div>
  <table class="main">
    <thead>
      <tr>
        <th style="width:44px;">No. of Article</th>
        <th>Description of the Gold Jewellery</th>
        <th style="width:88px;">Gross Weight (In grams)</th>
        <th style="width:88px;">Net Weight (In grams)</th>
        <th style="width:54px;">Carat</th>
        <th style="width:72px;">Rate per Gram</th>
        <th style="width:88px;">Market Value (in ₹)</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:center;">Total</td>
        <td>${totalGrossWeight}</td>
        <td>${totalNetWeight}</td>
        <td></td>
        <td></td>
        <td>${formatCurrency(totalMarketValue)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="mv-section">
    <div class="line">
      Market value for above Gold @ <span class="underline">${marketValueForGoldPercent}%</span> is
      <span class="underline-lg">${formatCurrency(totalMarketValue)}</span>
      &nbsp;&nbsp;&nbsp; ${ltvPercent}% of market value is  <span class="underline-lg">${formatCurrency(maxAllowableLoan)}</span>
    </div>
    <div class="line">
      Advanced value as per Bank's Norms ₹ <span class="underline-lg">${formatCurrency(advancedValueNorms)}</span>
    </div>
    <div class="line">
      Limit As per Bank's Advance Rate : <span class="underline-lg">${advancedValueType}</span>
    </div>
  </div>
  <div style="margin-top: 24px;"></div>
  <div class="loan-amount-box">
    <div class="label-box">Loan Amount ₹</div>
    <div class="underline">${formatCurrency(finalAmount)}</div>
  </div>
  <div class="sign-grid">
    <div class="sign-line"><label>Sign of Customer</label><div class="underline"></div></div>
    <div class="sign-line"><label>Sign of Manager</label><div class="underline"></div></div>
  </div>
  <div class="sign-grid" style="margin-top: 20px;">
    <div class="sign-line"><label>Sign of Officer</label><div class="underline"></div></div>
    <div class="sign-line"><label>Sign of Officer</label><div class="underline"></div></div>
  </div>
  <div style="margin-top: 24px;"></div>
  <div class="cert-title">Valuation Certificate</div>
  <div class="cert-text">
    I hereby certify that I have tested / appraised the above & the gross weight of the article, net weight of Gold, Carat
    purity of fineness, rate per gram & market value shown against the ornaments mentioned is ₹ ${formatCurrency(totalMarketValue)}
    to the best of my knowledge correct & in order.
  </div>
  <div class="footer-row">
    <div><strong>Date :</strong> ${formatDate(new Date())}</div>
    <div style="padding-top: 40px;"><strong>Signature of Assayer</strong></div>
  </div>
</div>
</body>
</html>`;
}

async function generatePDF(loan, bank, categories, settings = null) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const html = buildHTML(loan, bank, categories, settings, baseUrl);
  const filename = `loan_${loan._id}_${randomUUID()}.pdf`;
  const docsDir =
    process.env.NODE_ENV === 'production'
      ? '/app/cloud/documents'
      : path.join(__dirname, '../uploads/pdf');
  const outputPath = path.join(docsDir, filename);
  const pdfUrl =
    process.env.NODE_ENV === 'production'
      ? `${baseUrl}/cloud/documents/${filename}`
      : `${baseUrl}/uploads/pdf/${filename}`;

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

  return pdfUrl;
}

module.exports = { generatePDF };
