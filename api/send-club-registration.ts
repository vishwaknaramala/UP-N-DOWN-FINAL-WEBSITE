import { Resend } from 'resend';
import dotenv from 'dotenv';
import {
  generateCustomerConfirmationEmail,
  generateOwnerNotificationEmail,
} from '../server/emailTemplates.js';
import {
  isSupabaseConfigured,
  registerToSupabase,
  normalizeEmail,
} from '../server/supabase.js';

dotenv.config({ override: true });

const MAX_CLUB_SLOTS = 100;

function getSenderString(brandLabel: string, sender: string): string {
  if (sender.includes('<') && sender.includes('>')) {
    return sender;
  }
  return `${brandLabel} <${sender}>`;
}

export default async function handler(req: any, res: any) {
  // Enable CORS for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};
    const {
      name,
      email,
      phone,
      passCode,
      positionNumber,
      sizePreference,
      tshirtSize,
      pantSize,
      capSize,
      shirt_size,
      categories = [],
      launchDate = '31st Dec 2026',
      cryptoSignature = '',
      notes,
    } = body;

    const rawEmail = typeof email === 'string' ? email : '';
    const normalizedEmail = normalizeEmail(rawEmail);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        error: 'A valid email address is required for registration.',
      });
    }

    const effectiveShirtSize = (shirt_size || sizePreference || 'M (Oversized)').trim();
    const cleanName = typeof name === 'string' ? name.trim() : undefined;
    const cleanPhone = typeof phone === 'string' ? phone.trim() : undefined;

    const effectiveTShirt = (tshirtSize || body.tshirt_size || shirt_size || sizePreference || 'M (Oversized)').trim();
    const effectivePant = (pantSize || body.pant_size || body.denim_jeans_size || '32 (Wide)').trim();
    const effectiveCap = (capSize || body.cap_size || 'One Size (Adjustable)').trim();

    // 1. Supabase Registration
    let totalCount = 1;
    let remainingSlots = MAX_CLUB_SLOTS - 1;
    let member: any = null;

    if (isSupabaseConfigured()) {
      const sbResult = await registerToSupabase({
        name: cleanName,
        email: normalizedEmail,
        phone: cleanPhone,
        tshirt_size: effectiveTShirt,
        pant_size: effectivePant,
        cap_size: effectiveCap,
        shirt_size: effectiveShirtSize,
      });

      if (!sbResult.success) {
        if (sbResult.code === 'DUPLICATE_EMAIL') {
          return res.status(409).json({
            success: false,
            code: 'DUPLICATE_EMAIL',
            error: 'This email is already registered.',
            totalRegistrations: sbResult.totalCount,
            maxSlots: MAX_CLUB_SLOTS,
          });
        }
        if (sbResult.code === 'CAPACITY_REACHED') {
          return res.status(400).json({
            success: false,
            code: 'CAPACITY_REACHED',
            error: sbResult.error || 'THE CLUB allocation is fully booked.',
            totalRegistrations: sbResult.totalCount,
            maxSlots: MAX_CLUB_SLOTS,
          });
        }
        if (sbResult.code === 'RLS_RESTRICTION') {
          return res.status(403).json({
            success: false,
            code: 'RLS_RESTRICTION',
            error: 'Database RLS policy active. Add an INSERT policy on CLUB_REGISTRATIONS in Supabase SQL editor.',
            totalRegistrations: sbResult.totalCount,
            maxSlots: MAX_CLUB_SLOTS,
          });
        }
        return res.status(400).json({
          success: false,
          code: sbResult.code,
          error: sbResult.error || 'Database registration failed.',
          totalRegistrations: sbResult.totalCount,
          maxSlots: MAX_CLUB_SLOTS,
        });
      }

      const slotNumber = sbResult.positionNumber || (sbResult.totalCount || 1);
      totalCount = sbResult.totalCount || slotNumber;
      remainingSlots = Math.max(0, MAX_CLUB_SLOTS - totalCount);

      const safePass = passCode || `UND-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const safeSig = cryptoSignature || 'SHA256_VERIFIED_ATELIER_2026';
      const safeDate = sbResult.record?.created_at || new Date().toISOString();

      member = {
        id: sbResult.record?.id ? String(sbResult.record.id) : `und-member-${Date.now()}`,
        name: cleanName,
        email: normalizedEmail,
        rawEmail,
        phone: cleanPhone,
        passCode: safePass,
        positionNumber: slotNumber,
        sizePreference: effectiveShirtSize,
        tshirtSize: effectiveTShirt,
        pantSize: effectivePant,
        capSize: effectiveCap,
        categories,
        launchDate,
        cryptoSignature: safeSig,
        registeredAt: safeDate,
        createdAt: safeDate,
        source: 'web_registration',
        notes,
        supabaseSynced: true,
        supabaseId: sbResult.record?.id,
      };
    } else {
      const safePass = passCode || `UND-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const safeSig = cryptoSignature || 'SHA256_VERIFIED_ATELIER_2026';
      const safeDate = new Date().toISOString();

      member = {
        id: `und-member-${Date.now()}`,
        name: cleanName,
        email: normalizedEmail,
        rawEmail,
        phone: cleanPhone,
        passCode: safePass,
        positionNumber: Number(positionNumber) || 1,
        sizePreference: effectiveShirtSize,
        tshirtSize: effectiveTShirt,
        pantSize: effectivePant,
        capSize: effectiveCap,
        categories,
        launchDate,
        cryptoSignature: safeSig,
        registeredAt: safeDate,
        createdAt: safeDate,
        source: 'web_registration',
        notes,
      };
    }

    // 2. Prepare Resend Email Delivery
    const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || '';
    const rawFromEmail = process.env.RESEND_FROM_EMAIL?.trim() || '';
    const RESEND_FROM_EMAIL = rawFromEmail && rawFromEmail !== 'onboarding@resend.dev'
      ? rawFromEmail
      : 'club@upndownstore.in';
    const OWNER_NOTIFICATION_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL?.trim() || 'vishwaknaramala@gmail.com';

    const customerEmail = generateCustomerConfirmationEmail({
      name: member.name,
      email: member.email,
      phone: member.phone,
      passCode: member.passCode,
      positionNumber: member.positionNumber,
      sizePreference: member.sizePreference,
      categories: member.categories,
      launchDate: member.launchDate,
      cryptoSignature: member.cryptoSignature,
    });

    const ownerEmail = generateOwnerNotificationEmail({
      name: member.name,
      email: member.email,
      phone: member.phone,
      passCode: member.passCode,
      positionNumber: member.positionNumber,
      sizePreference: member.sizePreference,
      categories: member.categories,
      launchDate: member.launchDate,
      cryptoSignature: member.cryptoSignature,
      registeredAt: member.registeredAt,
      notes: member.notes,
    });

    const customerDelivery = {
      to: member.email,
      status: 'pending',
      id: `msg_${Date.now()}_cust`,
      error: null as string | null,
    };

    const ownerDelivery = {
      to: OWNER_NOTIFICATION_EMAIL,
      status: 'pending',
      id: `msg_${Date.now()}_own`,
      error: null as string | null,
    };

    if (RESEND_API_KEY && RESEND_API_KEY.length > 5) {
      const resend = new Resend(RESEND_API_KEY);
      let customerSender = getSenderString('UP N DOWN Atelier', RESEND_FROM_EMAIL);
      let ownerSender = getSenderString('UP N DOWN Storefront', RESEND_FROM_EMAIL);

      // Attempt customer email dispatch
      try {
        let custResult = await resend.emails.send({
          from: customerSender,
          to: member.email,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text,
        });

        // If custom domain unverified in Resend, retry with onboarding@resend.dev if target matches owner
        if (custResult.error) {
          const errMsg = custResult.error.message || '';
          console.warn('[Resend Customer Email Warning]:', errMsg);
          if (errMsg.toLowerCase().includes('not verified') && member.email.toLowerCase() === OWNER_NOTIFICATION_EMAIL.toLowerCase()) {
            customerSender = 'UP N DOWN Atelier <onboarding@resend.dev>';
            custResult = await resend.emails.send({
              from: customerSender,
              to: member.email,
              subject: customerEmail.subject,
              html: customerEmail.html,
              text: customerEmail.text,
            });
          }
        }

        if (custResult.error) {
          customerDelivery.status = 'error';
          customerDelivery.error = custResult.error.message;
        } else {
          customerDelivery.status = 'delivered';
          customerDelivery.id = custResult.data?.id || customerDelivery.id;
        }
      } catch (custEx: any) {
        customerDelivery.status = 'error';
        customerDelivery.error = custEx.message || 'Failed to dispatch customer email';
      }

      // Attempt owner notification email dispatch
      try {
        let ownResult = await resend.emails.send({
          from: ownerSender,
          to: OWNER_NOTIFICATION_EMAIL,
          subject: ownerEmail.subject,
          html: ownerEmail.html,
          text: ownerEmail.text,
        });

        // If custom domain unverified, fallback to onboarding@resend.dev for owner delivery
        if (ownResult.error && ownResult.error.message?.toLowerCase().includes('not verified')) {
          ownerSender = 'UP N DOWN Storefront <onboarding@resend.dev>';
          ownResult = await resend.emails.send({
            from: ownerSender,
            to: OWNER_NOTIFICATION_EMAIL,
            subject: ownerEmail.subject,
            html: ownerEmail.html,
            text: ownerEmail.text,
          });
        }

        if (ownResult.error) {
          ownerDelivery.status = 'error';
          ownerDelivery.error = ownResult.error.message;
        } else {
          ownerDelivery.status = 'delivered';
          ownerDelivery.id = ownResult.data?.id || ownerDelivery.id;
        }
      } catch (ownEx: any) {
        ownerDelivery.status = 'error';
        ownerDelivery.error = ownEx.message || 'Failed to dispatch owner alert';
      }

      return res.status(200).json({
        success: true,
        mode: 'live_resend',
        registration: member,
        totalRegistrations: totalCount,
        remainingSlots,
        maxSlots: MAX_CLUB_SLOTS,
        customerDelivery,
        ownerDelivery,
        dispatchedAt: member.registeredAt,
      });
    }

    // No RESEND_API_KEY in environment
    customerDelivery.status = 'simulated';
    customerDelivery.error = 'RESEND_API_KEY is not configured in Vercel Environment Variables.';
    ownerDelivery.status = 'simulated';
    ownerDelivery.error = 'RESEND_API_KEY is not configured in Vercel Environment Variables.';

    return res.status(200).json({
      success: true,
      mode: 'simulated_no_api_key',
      message: 'Registration confirmed in database. Add RESEND_API_KEY in Vercel Settings -> Environment Variables to dispatch live emails.',
      registration: member,
      totalRegistrations: totalCount,
      remainingSlots,
      maxSlots: MAX_CLUB_SLOTS,
      customerDelivery,
      ownerDelivery,
      dispatchedAt: member.registeredAt,
    });
  } catch (err: any) {
    console.error('[API send-club-registration error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error processing registration.',
    });
  }
}
