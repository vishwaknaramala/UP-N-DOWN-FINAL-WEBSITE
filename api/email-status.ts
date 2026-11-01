import dotenv from 'dotenv';
import { isSupabaseConfigured, getSupabaseCount } from '../server/supabase.js';

dotenv.config({ override: true });

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const key = process.env.RESEND_API_KEY?.trim() || '';
  const isConfigured = Boolean(key && key.length > 5);
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'club@upndownstore.in';
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL?.trim() || 'vishwaknaramala@gmail.com';

  let supabaseTotal: number | null = null;
  if (isSupabaseConfigured()) {
    supabaseTotal = await getSupabaseCount();
  }

  return res.status(200).json({
    emailService: {
      configured: isConfigured,
      keyPrefix: isConfigured ? `${key.substring(0, 6)}...` : 'NOT_CONFIGURED_IN_VERCEL',
      fromEmail,
      ownerEmail,
      hint: isConfigured
        ? 'Resend API key is present in environment.'
        : 'RESEND_API_KEY is missing in Vercel Project Settings -> Environment Variables.',
    },
    databaseService: {
      supabaseConfigured: isSupabaseConfigured(),
      totalRegistrationsInSupabase: supabaseTotal,
      maxSlots: 100,
      remainingSlots: Math.max(0, 100 - (supabaseTotal || 0)),
    },
    timestamp: new Date().toISOString(),
  });
}
