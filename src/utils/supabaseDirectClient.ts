import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || 'https://uwoyznudoiwjttoxnptr.supabase.co';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

let clientInstance: SupabaseClient | null = null;

export function getDirectSupabaseClient(): SupabaseClient | null {
  if (!cleanUrl || !anonKey) return null;
  if (!clientInstance) {
    clientInstance = createClient(cleanUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return clientInstance;
}

export function isDirectSupabaseConfigured(): boolean {
  return Boolean(cleanUrl && anonKey && anonKey.length > 10);
}

export interface DirectRegisterParams {
  name?: string;
  email: string;
  phone?: string;
  sizePreference?: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
}

export interface DirectRegisterResult {
  success: boolean;
  code?: 'DUPLICATE_EMAIL' | 'CAPACITY_REACHED' | 'RLS_RESTRICTION' | 'DB_ERROR' | 'NOT_CONFIGURED';
  error?: string;
  record?: any;
  positionNumber?: number;
  totalCount?: number;
}

/**
 * Direct browser fallback to Supabase table CLUB_REGISTRATIONS
 * Used when backend server route /api/send-club-registration is unreachable (e.g. static Vercel host)
 */
export async function registerDirectToSupabase(params: DirectRegisterParams): Promise<DirectRegisterResult> {
  const supabase = getDirectSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      code: 'NOT_CONFIGURED',
      error: 'Supabase credentials are not configured in client environment.',
    };
  }

  const normalizedEmail = (params.email || '').trim().toLowerCase();
  const effectiveTShirt = (params.tshirtSize || params.sizePreference || 'M (Oversized)').trim();
  const effectivePant = (params.pantSize || '32 (Wide)').trim();
  const effectiveCap = (params.capSize || 'One Size (Adjustable)').trim();

  try {
    // 1. Check current capacity
    const { count, error: countErr } = await supabase
      .from('CLUB_REGISTRATIONS')
      .select('*', { count: 'exact', head: true });

    const currentTotal = typeof count === 'number' ? count : 0;
    if (currentTotal >= 100) {
      return {
        success: false,
        code: 'CAPACITY_REACHED',
        error: 'THE CLUB allocation is fully booked. All 100 member slots for Drop 01 have been claimed.',
        totalCount: currentTotal,
      };
    }

    // 2. Check duplicate email
    const { data: dupRows } = await supabase
      .from('CLUB_REGISTRATIONS')
      .select('EMAIL')
      .ilike('EMAIL', normalizedEmail)
      .limit(1);

    if (dupRows && dupRows.length > 0) {
      return {
        success: false,
        code: 'DUPLICATE_EMAIL',
        error: 'This email is already registered.',
        totalCount: currentTotal,
      };
    }

    // 3. Build insert payload matching CLUB_REGISTRATIONS columns
    const payload = {
      NAME: params.name?.trim() || null,
      EMAIL: normalizedEmail,
      PHONE: params.phone?.trim() || null,
      T_SHIRT_SIZE: effectiveTShirt,
      CAP_SIZE: effectiveCap,
      DENIM_JEANS_SIZE: effectivePant,
    };

    let insertRes = await supabase.from('CLUB_REGISTRATIONS').insert([payload]).select();

    // If .select() hit RLS, retry without .select()
    if (insertRes.error && insertRes.error.code === '42501') {
      const plain = await supabase.from('CLUB_REGISTRATIONS').insert([payload]);
      if (!plain.error) {
        insertRes = {
          data: [{ ...payload, id: currentTotal + 1, created_at: new Date().toISOString() }],
          error: null,
        } as any;
      }
    }

    if (insertRes.error) {
      const err = insertRes.error;
      if (err.code === '23505' || err.message?.toLowerCase().includes('duplicate') || err.message?.toLowerCase().includes('unique')) {
        return {
          success: false,
          code: 'DUPLICATE_EMAIL',
          error: 'This email is already registered.',
          totalCount: currentTotal,
        };
      }
      if (err.code === '42501') {
        return {
          success: false,
          code: 'RLS_RESTRICTION',
          error: 'Database RLS policy active. Please add an INSERT policy on CLUB_REGISTRATIONS in Supabase SQL Editor.',
          totalCount: currentTotal,
        };
      }
      return {
        success: false,
        code: 'DB_ERROR',
        error: err.message || 'Database registration error.',
        totalCount: currentTotal,
      };
    }

    const inserted = insertRes.data && insertRes.data[0] ? insertRes.data[0] : payload;
    const nextPos = currentTotal + 1;

    return {
      success: true,
      record: inserted,
      positionNumber: nextPos,
      totalCount: nextPos,
    };
  } catch (err: any) {
    return {
      success: false,
      code: 'DB_ERROR',
      error: err.message || 'Unexpected network error connecting to Supabase.',
    };
  }
}
