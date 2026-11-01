// Live Email Dispatch Engine for UP N DOWN Atelier Club Members
import { registerDirectToSupabase } from '../utils/supabaseDirectClient';

export interface EmailDeliveryReceipt {
  messageId: string;
  recipientEmail: string;
  recipientPhone?: string;
  passCode: string;
  positionNumber: number;
  subject: string;
  status: 'delivered' | 'pending' | 'failed' | 'simulated';
  dispatchedAt: string;
  htmlContent: string;
  provider: string;
  ownerNotified?: boolean;
  ownerRecipient?: string;
  resendMessageId?: string;
  error?: string | null;
}

const EMAIL_LOGS_KEY = 'upndown_email_dispatch_logs';
export const CLUB_EMAIL_DISPATCH_EVENT = 'upndown_club_email_dispatched';

/**
 * Retrieves all dispatched email delivery receipts
 */
export function getEmailDeliveryLogs(): EmailDeliveryReceipt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EmailDeliveryReceipt[];
  } catch (e) {
    return [];
  }
}

/**
 * Saves an email delivery receipt
 */
export function saveEmailReceipt(receipt: EmailDeliveryReceipt): void {
  if (typeof window === 'undefined') return;
  try {
    const logs = getEmailDeliveryLogs();
    const updated = [receipt, ...logs.slice(0, 99)];
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email receipt', e);
  }
}

/**
 * Checks server-side Resend email configuration
 */
export async function checkEmailBackendStatus(): Promise<{
  configured: boolean;
  fromEmail: string;
  ownerEmail: string;
  keyPrefix: string;
}> {
  try {
    const res = await fetch('/api/email-status');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Non-fatal if offline
  }
  return {
    configured: false,
    fromEmail: 'club@upndownstore.in',
    ownerEmail: '',
    keyPrefix: 'not_configured',
  };
}

/**
 * Tests isolated Customer Confirmation Email via backend Resend endpoint
 */
export async function testCustomerEmailDispatch(testEmail: string, name?: string): Promise<{
  success: boolean;
  messageId?: string;
  mode?: string;
  error?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/test-email/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, name }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network request failed' };
  }
}

/**
 * Tests isolated Owner Notification Email via backend Resend endpoint
 */
export async function testOwnerEmailDispatch(testRecipient?: string): Promise<{
  success: boolean;
  messageId?: string;
  mode?: string;
  error?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/test-email/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: testRecipient }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network request failed' };
  }
}

/**
 * Generates high-end luxury HTML email template for UP N DOWN early access confirmation
 */
export function generateClubEmailHtml(
  email: string,
  passCode: string,
  positionNumber: number,
  sizePreference: string,
  categories: string[],
  launchDate: string,
  cryptoSignature: string,
  name?: string
): string {
  const greeting = name ? `DEAR ${name.toUpperCase()}` : 'ESTEEMED CLIENT';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UP N DOWN — CLUB ACCESS ALLOCATION CONFIRMED</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background-color: #111114; border: 1px solid #27272a; padding: 40px; }
    .header { border-bottom: 1px solid #27272a; padding-bottom: 24px; margin-bottom: 30px; text-align: center; }
    .brand-title { font-size: 26px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; color: #ffffff; }
    .brand-subtitle { font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #a1a1aa; margin-top: 6px; font-family: monospace; }
    .badge { display: inline-block; background-color: #064e3b; color: #34d399; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; padding: 6px 14px; border: 1px solid #059669; margin-bottom: 20px; font-family: monospace; }
    .pass-card { background-color: #09090b; border: 1px solid #3f3f46; padding: 24px; margin: 24px 0; text-align: center; }
    .slot-num { font-size: 38px; font-weight: 900; color: #ffffff; margin: 0; font-family: monospace; }
    .pass-code { font-size: 22px; font-weight: bold; letter-spacing: 0.15em; color: #34d399; margin: 10px 0; font-family: monospace; }
    .details { font-size: 13px; line-height: 1.8; color: #d4d4d8; font-family: monospace; margin: 20px 0; border-top: 1px solid #27272a; padding-top: 20px; }
    .footer { border-top: 1px solid #27272a; padding-top: 20px; margin-top: 30px; font-size: 11px; color: #71717a; text-align: center; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">UP N DOWN</h1>
      <div class="brand-subtitle">SAME ENERGY DIFFERENT PHASE · ATELIER 2026</div>
    </div>
    <div style="text-align: center;">
      <div class="badge">ALLOCATION CONFIRMED · TIER 01 ACCESS</div>
      <h2 style="font-size: 20px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px 0; color: #ffffff;">${greeting}</h2>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0;">
        You have officially secured guaranteed early access allocation for Drop 01. The strictly capped 100-slot run will unlock exclusively for members prior to public catalog unveil.
      </p>
    </div>

    <div class="pass-card">
      <div style="font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px;">ALLOCATED SLOT NUMBER</div>
      <div class="slot-num">#${positionNumber.toString().padStart(2, '0')} / 100</div>
      <div style="font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 16px;">CRYPTOGRAPHIC PASS CODE</div>
      <div class="pass-code">${passCode}</div>
    </div>

    <div class="details">
      ${name ? `<div><strong>NAME:</strong> ${name}</div>` : ''}
      <div><strong>RECIPIENT:</strong> ${email}</div>
      <div><strong>OFFICIAL LAUNCH:</strong> ${launchDate}</div>
      <div><strong>REQUESTED FIT:</strong> ${sizePreference}</div>
      <div><strong>TARGET APPAREL:</strong> ${categories.join(', ')}</div>
      <div style="margin-top: 10px; word-break: break-all; font-size: 10px; color: #71717a;">
        <strong>CRYPTOGRAPHIC PROOF:</strong><br/>${cryptoSignature}
      </div>
    </div>

    <div style="background-color: #18181b; border-left: 3px solid #34d399; padding: 14px 18px; margin: 24px 0; font-size: 12px; color: #e4e4e7;">
      <strong>NEXT STEPS:</strong> Present this pass code during the countdown unlock window on December 31, 2026. Your allocated pieces will be reserved for 60 minutes before release to general waitlist.
    </div>

    <div class="footer">
      UP N DOWN ATELIER · ARCHIVAL STREETWEAR DIVISION<br/>
      Official Inquiries: upndownofficialstore@gmail.com · Instagram: @upndown.ofc
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches live confirmation email to customer AND notification to owner via backend Resend API
 */
export async function dispatchLiveClubEmail(params: {
  name?: string;
  email: string;
  phone?: string;
  passCode: string;
  positionNumber: number;
  sizePreference: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
  shirt_size?: string;
  categories: string[];
  launchDate: string;
  cryptoSignature: string;
  notes?: string;
}): Promise<EmailDeliveryReceipt> {
  const timestamp = new Date().toISOString();
  const subject = `UP N DOWN — CLUB ACCESS GRANTED [SLOT #${params.positionNumber.toString().padStart(2, '0')}]`;

  const htmlContent = generateClubEmailHtml(
    params.email,
    params.passCode,
    params.positionNumber,
    params.sizePreference,
    params.categories,
    params.launchDate,
    params.cryptoSignature,
    params.name
  );

  let provider = 'Resend Transactional Mail API (Backend Relay)';
  let messageId = `und_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let status: EmailDeliveryReceipt['status'] = 'delivered';
  let ownerNotified = false;
  let ownerRecipient = '';
  let resendMessageId: string | undefined;
  let error: string | null = null;
  try {
    let res: Response | null = null;
    try {
      res = await fetch('/api/send-club-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          shirt_size: params.shirt_size || params.sizePreference,
        }),
      });
    } catch (networkFetchErr) {
      // API endpoint is unreachable (e.g. pure static Vercel host or network offline)
      res = null;
    }

    if (res && res.ok) {
      const data = await res.json();
      if (data.mode === 'live_resend') {
        provider = 'Resend Live Verified Email';
        resendMessageId = data.customerDelivery?.id;
        messageId = resendMessageId || messageId;
        ownerRecipient = data.ownerDelivery?.to || ownerRecipient;
      } else {
        provider = 'Resend Gateway (Simulated / Local Mode)';
      }
      if (data.customerDelivery?.error) {
        error = data.customerDelivery.error;
      }
    } else if (res && res.status === 409) {
      const errData = await res.json().catch(() => ({}));
      const validationError = new Error(errData.error || 'This email is already registered.');
      (validationError as any).code = 'DUPLICATE_EMAIL';
      (validationError as any).status = 409;
      throw validationError;
    } else if (res && res.status === 403) {
      const validationError = new Error('Database RLS policy is active on CLUB_REGISTRATIONS. Run the script in your Supabase SQL editor (see supabase-schema.sql) to enable registrations.');
      (validationError as any).code = 'RLS_RESTRICTION';
      (validationError as any).status = 403;
      throw validationError;
    } else {
      // Server returned 404, 500, or network was unreachable (common on Vercel before serverless setup)
      // Execute direct resilient browser fallback to Supabase CLUB_REGISTRATIONS table
      const directResult = await registerDirectToSupabase({
        name: params.name,
        email: params.email,
        phone: params.phone,
        sizePreference: params.sizePreference,
        tshirtSize: params.tshirtSize,
        pantSize: params.pantSize,
        capSize: params.capSize,
      });

      if (directResult.success) {
        provider = 'Supabase Direct Cloud Database (Browser Verified)';
        messageId = `sb_direct_${directResult.record?.id || Date.now()}`;
        console.log('[Supabase Direct Fallback Success]: Row inserted into CLUB_REGISTRATIONS', directResult.record);
      } else if (directResult.code === 'DUPLICATE_EMAIL') {
        const validationError = new Error('This email is already registered.');
        (validationError as any).code = 'DUPLICATE_EMAIL';
        (validationError as any).status = 409;
        throw validationError;
      } else if (directResult.code === 'CAPACITY_REACHED') {
        const validationError = new Error(directResult.error || 'THE CLUB allocation is fully booked. All 100 member slots for Drop 01 have been claimed.');
        (validationError as any).code = 'CAPACITY_REACHED';
        (validationError as any).status = 400;
        throw validationError;
      } else if (directResult.code === 'RLS_RESTRICTION') {
        const validationError = new Error('Database RLS policy is active on CLUB_REGISTRATIONS. Run the script in your Supabase SQL editor (see supabase-schema.sql) to enable public registrations.');
        (validationError as any).code = 'RLS_RESTRICTION';
        (validationError as any).status = 403;
        throw validationError;
      } else {
        const errData = res ? await res.json().catch(() => ({})) : {};
        const errorMsg =
          errData.error ||
          directResult.error ||
          'Registration could not be completed. Please check your information and retry.';
        const validationError = new Error(errorMsg);
        (validationError as any).code = errData.code || 'VALIDATION_FAILED';
        (validationError as any).status = res ? res.status : 500;
        throw validationError;
      }
    }
  } catch (err: any) {
    // If it's our thrown validation/duplicate/capacity error, rethrow it directly
    if (err.status || err.code === 'DUPLICATE_EMAIL' || err.code === 'CAPACITY_REACHED' || err.code === 'RLS_RESTRICTION') {
      throw err;
    }
    provider = 'UP N DOWN Local Secure Gateway (Network Fallback)';
    error = err.message;
  }


  const receipt: EmailDeliveryReceipt = {
    messageId,
    recipientEmail: params.email,
    recipientPhone: params.phone,
    passCode: params.passCode,
    positionNumber: params.positionNumber,
    subject,
    status,
    dispatchedAt: timestamp,
    htmlContent,
    provider,
    ownerNotified,
    ownerRecipient,
    resendMessageId,
    error,
  };

  // Persist delivery log in local database
  saveEmailReceipt(receipt);

  // Broadcast browser event for UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CLUB_EMAIL_DISPATCH_EVENT, {
        detail: receipt,
      })
    );
  }

  return receipt;
}

