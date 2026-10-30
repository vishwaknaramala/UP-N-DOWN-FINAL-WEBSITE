// Luxury Email Templates for UP N DOWN Atelier
// 1. Customer Registration Confirmation Email
// 2. Owner New Registration Notification Email

export interface CustomerEmailParams {
  name?: string;
  email: string;
  phone?: string;
  passCode: string;
  positionNumber: number;
  sizePreference: string;
  categories: string[];
  launchDate: string;
  cryptoSignature: string;
}

export interface OwnerNotificationParams {
  name?: string;
  email: string;
  phone?: string;
  passCode: string;
  positionNumber: number;
  sizePreference: string;
  categories: string[];
  launchDate: string;
  cryptoSignature: string;
  registeredAt?: string;
  notes?: string;
}

/**
 * Generates the Customer Registration Confirmation Email
 */
export function generateCustomerConfirmationEmail(params: CustomerEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const slotFormatted = params.positionNumber.toString().padStart(2, '0');
  const greetingName = params.name ? params.name.trim() : 'Esteemed Client';
  const categoriesList = params.categories && params.categories.length > 0
    ? params.categories.join(' · ')
    : 'Drop 01 Capsule (Cap, Denim, Heavy Tees)';

  const subject = `UP N DOWN — CLUB ACCESS GRANTED [SLOT #${slotFormatted} / 100]`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050507; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #050507; padding: 40px 10px; }
    .main-card { max-width: 620px; margin: 0 auto; background-color: #0e0e11; border: 1px solid #27272a; border-radius: 4px; overflow: hidden; }
    .header { padding: 36px 30px 24px 30px; text-align: center; border-bottom: 1px solid #1f1f23; background-color: #121216; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; color: #ffffff; margin: 0; }
    .brand-subtitle { font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: #a1a1aa; margin-top: 8px; font-family: 'SF Mono', Monaco, Consolas, monospace; }
    .badge-bar { margin: 18px 0 0 0; }
    .badge { display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; padding: 6px 14px; border: 1px solid #059669; border-radius: 2px; font-family: 'SF Mono', Monaco, Consolas, monospace; }
    .content { padding: 32px 30px; }
    .greeting { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .intro-text { font-size: 14px; line-height: 1.7; color: #a1a1aa; margin: 0 0 24px 0; }
    .slot-box { background: linear-gradient(180deg, #16161a 0%, #0d0d10 100%); border: 1px solid #3f3f46; border-radius: 4px; padding: 26px; text-align: center; margin: 0 0 26px 0; }
    .slot-label { font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #71717a; font-family: 'SF Mono', Monaco, Consolas, monospace; margin-bottom: 6px; }
    .slot-number { font-size: 42px; font-weight: 900; color: #ffffff; font-family: 'SF Mono', Monaco, Consolas, monospace; letter-spacing: 0.05em; margin: 0; line-height: 1; }
    .pass-divider { width: 40px; height: 1px; background-color: #3f3f46; margin: 16px auto; }
    .pass-label { font-size: 10px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #71717a; font-family: 'SF Mono', Monaco, Consolas, monospace; margin-bottom: 8px; }
    .pass-code { font-size: 22px; font-weight: 800; color: #34d399; font-family: 'SF Mono', Monaco, Consolas, monospace; letter-spacing: 0.18em; background-color: #06241b; border: 1px dashed #059669; padding: 8px 16px; display: inline-block; border-radius: 3px; }
    .spec-table { width: 100%; margin: 20px 0; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 12px; }
    .spec-table td { padding: 9px 0; border-bottom: 1px solid #1f1f23; }
    .spec-label { color: #71717a; width: 38%; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
    .spec-val { color: #f4f4f5; font-weight: 600; }
    .guidance-box { background-color: #16161c; border-left: 3px solid #34d399; padding: 16px 20px; margin: 26px 0; font-size: 12px; line-height: 1.7; color: #d4d4d8; }
    .footer { padding: 26px 30px; text-align: center; border-top: 1px solid #1f1f23; background-color: #0a0a0d; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 11px; color: #71717a; line-height: 1.8; }
    .footer a { color: #a1a1aa; text-decoration: none; border-bottom: 1px dotted #52525b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div class="main-card">
            <!-- Header -->
            <div class="header">
              <h1 class="brand-title">UP N DOWN</h1>
              <div class="brand-subtitle">SAME ENERGY DIFFERENT PHASE · ATELIER 2026</div>
              <div class="badge-bar">
                <span class="badge">ALLOCATION CONFIRMED · TIER 01</span>
              </div>
            </div>

            <!-- Content -->
            <div class="content">
              <h2 class="greeting">WELCOME, ${greetingName.toUpperCase()}</h2>
              <p class="intro-text">
                Your reservation for <strong>Drop 01</strong> has been officially recorded into our production ledger. Because our raw selvedge cotton weaving and heavy GSM milling processes are strictly limited to 100 clients worldwide, your allocation guarantees size reservation and private early access.
              </p>

              <!-- Slot & Pass Code Callout -->
              <div class="slot-box">
                <div class="slot-label">ALLOCATED CLUB SLOT</div>
                <div class="slot-number">#${slotFormatted} <span style="font-size: 20px; color: #71717a;">/ 100</span></div>
                <div class="pass-divider"></div>
                <div class="pass-label">CONFIDENTIAL ACCESS PASSCODE</div>
                <div class="pass-code">${params.passCode}</div>
              </div>

              <!-- Technical Allocation Specs -->
              <table class="spec-table">
                <tr>
                  <td class="spec-label">Recipient:</td>
                  <td class="spec-val">${params.email}</td>
                </tr>
                ${params.phone ? `<tr>
                  <td class="spec-label">Phone / SMS:</td>
                  <td class="spec-val">${params.phone}</td>
                </tr>` : ''}
                <tr>
                  <td class="spec-label">Target Sizing:</td>
                  <td class="spec-val">${params.sizePreference}</td>
                </tr>
                <tr>
                  <td class="spec-label">Target Apparel:</td>
                  <td class="spec-val">${categoriesList}</td>
                </tr>
                <tr>
                  <td class="spec-label">Official Launch:</td>
                  <td class="spec-val">${params.launchDate}</td>
                </tr>
                <tr>
                  <td class="spec-label">Early Window:</td>
                  <td class="spec-val">2 Hours Prior to General Public Unlock</td>
                </tr>
              </table>

              <!-- Next Steps Guidance -->
              <div class="guidance-box">
                <strong>NEXT STEPS:</strong><br/>
                Keep this email safe. On <strong>${params.launchDate}</strong>, return to the UP N DOWN website and enter your Secret Passcode (<strong>${params.passCode}</strong>) when the vault decrypts. Your requested size will be reserved for 60 minutes before opening to public waitlist.
              </div>

              <!-- Cryptographic Signature -->
              <div style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 10px; color: #52525b; line-height: 1.5; word-break: break-all; margin-top: 20px;">
                <strong>SHA-256 LEDGER SIGNATURE:</strong><br/>
                ${params.cryptoSignature}
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              UP N DOWN ATELIER · ARCHIVAL STREETWEAR DIVISION<br/>
              Support Inquiries: <a href="mailto:upndownofficialstore@gmail.com">upndownofficialstore@gmail.com</a><br/>
              Instagram: <a href="https://instagram.com/upndown.ofc">@upndown.ofc</a>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  const text = `UP N DOWN — CLUB ACCESS GRANTED
SAME ENERGY DIFFERENT PHASE · ATELIER 2026

Dear ${greetingName},

Your allocation for Drop 01 is confirmed!

ALLOCATED MEMBER SLOT: #${slotFormatted} / 100
SECRET PASSCODE: ${params.passCode}

ALLOCATION DETAILS:
- Recipient: ${params.email}
${params.phone ? `- Phone: ${params.phone}\n` : ''}- Target Sizing: ${params.sizePreference}
- Target Apparel: ${categoriesList}
- Official Launch: ${params.launchDate}
- Early Access Window: 2 Hours Prior to General Public

SHA-256 SIGNATURE:
${params.cryptoSignature}

Keep this passcode safe. On launch day, enter your passcode to unlock your reserved pieces.

UP N DOWN Atelier
Support: upndownofficialstore@gmail.com
Instagram: @upndown.ofc`;

  return { subject, html, text };
}

/**
 * Generates the Owner Notification Email
 */
export function generateOwnerNotificationEmail(params: OwnerNotificationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const slotFormatted = params.positionNumber.toString().padStart(2, '0');
  const customerName = params.name ? params.name.trim() : 'New Customer';
  const timeString = params.registeredAt
    ? new Date(params.registeredAt).toUTCString()
    : new Date().toUTCString();
  const categoriesList = params.categories && params.categories.length > 0
    ? params.categories.join(', ')
    : 'All Categories';

  const subject = `🚨 NEW CLUB MEMBER #${slotFormatted}: ${customerName} (${params.email}) — UP N DOWN`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; background-color: #09090b; padding: 30px 10px; }
    .card { max-width: 600px; margin: 0 auto; background-color: #111114; border: 1px solid #27272a; border-radius: 4px; overflow: hidden; }
    .header { background-color: #1a1625; border-bottom: 2px solid #8b5cf6; padding: 22px 24px; }
    .header-badge { font-family: monospace; font-size: 11px; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; margin-bottom: 6px; }
    .header-title { font-size: 20px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: 0.05em; text-transform: uppercase; }
    .content { padding: 24px; }
    .summary-box { background-color: #18181b; border: 1px solid #3f3f46; border-radius: 4px; padding: 18px; margin-bottom: 22px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-family: monospace; }
    .table-data { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; font-family: monospace; }
    .table-data td { padding: 10px 8px; border-bottom: 1px solid #27272a; }
    .label-col { color: #a1a1aa; width: 35%; font-weight: 600; text-transform: uppercase; font-size: 11px; }
    .val-col { color: #f4f4f5; font-weight: 700; }
    .val-col a { color: #38bdf8; text-decoration: none; }
    .action-row { margin: 24px 0 10px 0; text-align: center; }
    .action-btn { display: inline-block; background-color: #ffffff; color: #000000; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; padding: 12px 22px; text-decoration: none; border-radius: 2px; font-family: monospace; margin: 4px; }
    .footer { background-color: #09090b; padding: 18px 24px; text-align: center; border-top: 1px solid #27272a; font-size: 11px; font-family: monospace; color: #71717a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="header-badge">UP N DOWN · STORE OWNER ALERT</div>
        <h2 class="header-title">NEW CLUB REGISTRATION ALLOCATED</h2>
      </div>

      <div class="content">
        <div class="summary-box">
          <div style="font-family: monospace; font-size: 10px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">SLOT ALLOCATION</div>
          <div style="font-size: 28px; font-weight: 900; color: #34d399; font-family: monospace;">#${slotFormatted} / 100 CLAIMED</div>
          <div style="font-size: 11px; font-family: monospace; color: #a1a1aa; margin-top: 4px;">Pass Code: <strong style="color: #ffffff;">${params.passCode}</strong></div>
        </div>

        <table class="table-data">
          <tr>
            <td class="label-col">Customer Name:</td>
            <td class="val-col">${params.name || 'Not specified'}</td>
          </tr>
          <tr>
            <td class="label-col">Customer Email:</td>
            <td class="val-col"><a href="mailto:${params.email}?subject=UP%20N%20DOWN%20Drop%2001%20Allocation%20%23${slotFormatted}">${params.email}</a></td>
          </tr>
          <tr>
            <td class="label-col">Phone / WhatsApp:</td>
            <td class="val-col">${params.phone ? `<a href="tel:${params.phone}">${params.phone}</a>` : '<span style="color: #71717a;">None provided</span>'}</td>
          </tr>
          <tr>
            <td class="label-col">Requested Sizing:</td>
            <td class="val-col">${params.sizePreference}</td>
          </tr>
          <tr>
            <td class="label-col">Target Categories:</td>
            <td class="val-col">${categoriesList}</td>
          </tr>
          <tr>
            <td class="label-col">Registered At (UTC):</td>
            <td class="val-col">${timeString}</td>
          </tr>
          ${params.notes ? `<tr>
            <td class="label-col">Client Notes:</td>
            <td class="val-col">${params.notes}</td>
          </tr>` : ''}
          <tr>
            <td class="label-col">SHA-256 Proof:</td>
            <td class="val-col" style="font-size: 10px; color: #71717a; word-break: break-all;">${params.cryptoSignature}</td>
          </tr>
        </table>

        <div class="action-row">
          <a class="action-btn" href="mailto:${params.email}?subject=UP%20N%20DOWN%20Atelier%20Welcome%20-%20Slot%20%23${slotFormatted}">Reply to Client</a>
          ${params.phone ? `<a class="action-btn" style="background-color: #22c55e; color: #ffffff;" href="https://wa.me/${params.phone.replace(/[^0-9]/g, '')}">WhatsApp Client</a>` : ''}
        </div>
      </div>

      <div class="footer">
        UP N DOWN Atelier Automated Storefront Dispatch System<br/>
        Owner Target: vishwaknaramala@gmail.com · Secured with Resend
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `🚨 NEW CLUB REGISTRATION: SLOT #${slotFormatted} / 100

CUSTOMER INFORMATION:
- Name: ${params.name || 'Not provided'}
- Email: ${params.email}
- Phone: ${params.phone || 'None'}
- Size: ${params.sizePreference}
- Categories: ${categoriesList}
- Slot Number: #${slotFormatted} / 100
- Pass Code: ${params.passCode}
- Time: ${timeString}
${params.notes ? `- Notes: ${params.notes}\n` : ''}
- SHA-256 Signature: ${params.cryptoSignature}

Reply directly to customer: ${params.email}`;

  return { subject, html, text };
}
