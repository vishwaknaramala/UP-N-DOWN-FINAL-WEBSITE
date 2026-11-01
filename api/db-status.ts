import dotenv from 'dotenv';
import {
  isSupabaseConfigured,
  getSupabaseUrl,
  detectTableSchema,
  getSupabaseCount,
} from '../server/supabase.js';

dotenv.config({ override: true });

const MAX_CLUB_SLOTS = 100;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const configured = isSupabaseConfigured();
  let count: number | null = null;
  let activeTable = 'CLUB_REGISTRATIONS';
  let activeColumns = ['id', 'created_at', 'NAME', 'EMAIL', 'PHONE', 'T_SHIRT_SIZE', 'CAP_SIZE', 'DENIM_JEANS_SIZE'];

  if (configured) {
    count = await getSupabaseCount();
    const schema = await detectTableSchema();
    activeTable = schema.tableName;
    activeColumns = schema.detectedColumns;
  }

  const cleanUrl = getSupabaseUrl();
  const maskedUrl = cleanUrl.replace(/^(https?:\/\/[a-z0-9_-]{4})[a-z0-9_-]+(\..+)$/i, '$1****$2');
  const total = count !== null ? count : 0;

  return res.status(200).json({
    supabaseConfigured: configured,
    supabaseUrl: configured ? maskedUrl : 'Not configured (check Vercel Environment Variables)',
    tableName: activeTable,
    columns: activeColumns,
    totalRegistrations: total,
    maxSlots: MAX_CLUB_SLOTS,
    remainingSlots: Math.max(0, MAX_CLUB_SLOTS - total),
    pendingSyncCount: 0,
  });
}
