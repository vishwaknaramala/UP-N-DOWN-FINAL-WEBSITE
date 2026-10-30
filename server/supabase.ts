import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Ensure .env is loaded with override
dotenv.config({ override: true });

// Sanitize URL (removes any /rest/v1 or trailing slashes)
export function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export function getSupabaseUrl(): string {
  const raw = process.env.SUPABASE_URL || '';
  return cleanSupabaseUrl(raw);
}

export function getSupabaseKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

export const MAX_SUPABASE_REGISTRATIONS = 100;

export interface TableSchemaInfo {
  tableName: string;
  idCol: string;              // 'id' or 'ID'
  emailCol: string;           // 'EMAIL' or 'email'
  nameCol: string;            // 'NAME' or 'name'
  phoneCol: string;           // 'PHONE' or 'phone'
  tShirtSizeCol: string | null;   // 'T_SHIRT_SIZE' or 'SHIRT_SIZE' or 't_shirt_size'
  capSizeCol: string | null;      // 'CAP_SIZE' or 'cap_size'
  denimJeansSizeCol: string | null; // 'DENIM_JEANS_SIZE' or 'denim_jeans_size' or 'pant_size'
  shirtSizeCol: string;       // Compatibility alias for tShirtSizeCol || 'T_SHIRT_SIZE'
  createdAtCol: string;       // 'created_at' or 'CREATED_AT'
  detectedColumns: string[];  // Complete list of verified active columns
}

export interface SupabaseRegistrationRow {
  id?: string | number;
  created_at?: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  tshirt_size?: string;
  cap_size?: string;
  denim_jeans_size?: string;
  shirt_size?: string;
}

/**
 * Checks whether valid Supabase configuration is present in environment
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!url || !key) return false;
  if (url.includes('your-project-id') || key.includes('your-supabase')) {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Creates or retrieves the cached Supabase client
 */
let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  if (!cachedClient || lastClientUrl !== url || lastClientKey !== key) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastClientUrl = url;
    lastClientKey = key;
  }
  return cachedClient;
}

/**
 * Normalizes email: trim whitespace and convert to lowercase
 */
export function normalizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export interface SupabaseRegisterResult {
  success: boolean;
  code?: 'DUPLICATE_EMAIL' | 'CAPACITY_REACHED' | 'INVALID_INPUT' | 'DB_ERROR' | 'RLS_RESTRICTION';
  error?: string;
  record?: any;
  positionNumber?: number;
  totalCount?: number;
  usedFallback?: boolean;
}

// Candidate table names (the user table is CLUB_REGISTRATIONS)
const CANDIDATE_TABLES = ['CLUB_REGISTRATIONS', 'club_registrations'];

let cachedSchemaInfo: TableSchemaInfo | null = null;

/**
 * Helper to probe candidate column names against the Supabase table
 */
async function findExistingColumn(
  supabase: SupabaseClient,
  table: string,
  candidates: string[]
): Promise<string | null> {
  for (const col of candidates) {
    try {
      const { error } = await supabase.from(table).select(col).limit(0);
      if (
        !error ||
        (!error.message?.includes('schema cache') &&
         !error.message?.includes('does not exist') &&
         error.code !== 'PGRST204')
      ) {
        return col;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Accurately detects active table name and column casing (including T_SHIRT_SIZE, CAP_SIZE, DENIM_JEANS_SIZE)
 * to avoid PostgREST schema cache and nonexistent column errors.
 */
export async function detectTableSchema(forceRefresh: boolean = false): Promise<TableSchemaInfo> {
  if (cachedSchemaInfo && !forceRefresh) return cachedSchemaInfo;

  const supabase = getSupabaseClient();
  const defaultSchema: TableSchemaInfo = {
    tableName: 'CLUB_REGISTRATIONS',
    idCol: 'id',
    emailCol: 'EMAIL',
    nameCol: 'NAME',
    phoneCol: 'PHONE',
    tShirtSizeCol: 'T_SHIRT_SIZE',
    capSizeCol: 'CAP_SIZE',
    denimJeansSizeCol: 'DENIM_JEANS_SIZE',
    shirtSizeCol: 'T_SHIRT_SIZE',
    createdAtCol: 'created_at',
    detectedColumns: ['id', 'created_at', 'NAME', 'EMAIL', 'PHONE', 'T_SHIRT_SIZE', 'CAP_SIZE', 'DENIM_JEANS_SIZE'],
  };

  if (!supabase) return defaultSchema;

  // 1. Resolve active table name
  let activeTable = 'CLUB_REGISTRATIONS';
  for (const tbl of CANDIDATE_TABLES) {
    try {
      const { error } = await supabase.from(tbl).select('*', { count: 'exact', head: true });
      if (!error || error.code === '42501') {
        activeTable = tbl;
        break;
      }
    } catch {
      // Ignore and test next
    }
  }

  // 2. Sample first row if available to instantly read exact column identifiers
  let sampleColumnKeys: string[] = [];
  try {
    const { data: sampleRows, error: sampleErr } = await supabase.from(activeTable).select('*').limit(1);
    if (!sampleErr && sampleRows && sampleRows.length > 0) {
      sampleColumnKeys = Object.keys(sampleRows[0]);
    }
  } catch (probeErr) {
    console.warn('[Supabase Sample Row Probe Warning]:', probeErr);
  }

  // 3. Resolve individual column identifiers with priority matching
  const idCol =
    sampleColumnKeys.find((c) => c === 'id' || c === 'ID') ||
    (await findExistingColumn(supabase, activeTable, ['id', 'ID'])) ||
    'id';

  const emailCol =
    sampleColumnKeys.find((c) => c.toUpperCase() === 'EMAIL') ||
    (await findExistingColumn(supabase, activeTable, ['EMAIL', 'email'])) ||
    'EMAIL';

  const nameCol =
    sampleColumnKeys.find((c) => c.toUpperCase() === 'NAME') ||
    (await findExistingColumn(supabase, activeTable, ['NAME', 'name'])) ||
    'NAME';

  const phoneCol =
    sampleColumnKeys.find((c) => c.toUpperCase() === 'PHONE') ||
    (await findExistingColumn(supabase, activeTable, ['PHONE', 'phone'])) ||
    'PHONE';

  // T-Shirt size column (support T_SHIRT_SIZE, SHIRT_SIZE, etc.)
  const tShirtSizeCol =
    sampleColumnKeys.find((c) => c.toUpperCase() === 'T_SHIRT_SIZE') ||
    sampleColumnKeys.find((c) => c.toUpperCase() === 'SHIRT_SIZE') ||
    sampleColumnKeys.find((c) => c.toLowerCase().includes('shirt')) ||
    (await findExistingColumn(supabase, activeTable, [
      'T_SHIRT_SIZE',
      'SHIRT_SIZE',
      't_shirt_size',
      'shirt_size',
    ])) ||
    'T_SHIRT_SIZE';

  // CAP_SIZE column
  const capSizeCol =
    sampleColumnKeys.find((c) => c.toUpperCase() === 'CAP_SIZE') ||
    sampleColumnKeys.find((c) => c.toLowerCase().includes('cap')) ||
    (await findExistingColumn(supabase, activeTable, ['CAP_SIZE', 'cap_size']));

  // DENIM_JEANS_SIZE column
  const denimJeansSizeCol =
    sampleColumnKeys.find((c) => c.toUpperCase() === 'DENIM_JEANS_SIZE') ||
    sampleColumnKeys.find((c) => c.toLowerCase().includes('jeans')) ||
    sampleColumnKeys.find((c) => c.toLowerCase().includes('pant')) ||
    (await findExistingColumn(supabase, activeTable, [
      'DENIM_JEANS_SIZE',
      'denim_jeans_size',
      'PANT_SIZE',
      'pant_size',
    ]));

  const createdAtCol =
    sampleColumnKeys.find((c) => c.toLowerCase() === 'created_at') ||
    (await findExistingColumn(supabase, activeTable, ['created_at', 'CREATED_AT'])) ||
    'created_at';

  const shirtSizeCol = tShirtSizeCol || 'T_SHIRT_SIZE';

  // Gather unique non-null active columns
  const allDetected = Array.from(
    new Set([
      idCol,
      createdAtCol,
      nameCol,
      emailCol,
      phoneCol,
      tShirtSizeCol,
      capSizeCol,
      denimJeansSizeCol,
      ...sampleColumnKeys,
    ])
  ).filter(Boolean) as string[];

  cachedSchemaInfo = {
    tableName: activeTable,
    idCol,
    emailCol,
    nameCol,
    phoneCol,
    tShirtSizeCol,
    capSizeCol,
    denimJeansSizeCol,
    shirtSizeCol,
    createdAtCol,
    detectedColumns: allDetected,
  };

  console.log('[Supabase Schema Successfully Cached]:', cachedSchemaInfo);
  return cachedSchemaInfo;
}

export async function getActiveTableName(): Promise<string> {
  const schema = await detectTableSchema();
  return schema.tableName;
}

/**
 * Checks whether an email is registered in Supabase using the detected column case
 */
export async function isEmailRegisteredInSupabase(email: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const schema = await detectTableSchema();
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  try {
    const { data, error } = await supabase
      .from(schema.tableName)
      .select(schema.emailCol)
      .ilike(schema.emailCol, normalized)
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      return true;
    }
  } catch {
    // Non-fatal
  }
  return false;
}

/**
 * Registers a new club member into Supabase table:
 * 1. Trims spaces & converts email to lowercase
 * 2. Enforces maximum 100 registrations at database query level
 * 3. Enforces email uniqueness using detected column casing
 * 4. Inserts valid row: maps T_SHIRT_SIZE, CAP_SIZE, and DENIM_JEANS_SIZE accurately
 */
export async function registerToSupabase(payload: {
  name?: string;
  email: string;
  phone?: string;
  shirt_size?: string;
  tshirt_size?: string;
  tshirtSize?: string;
  pant_size?: string;
  pantSize?: string;
  denim_jeans_size?: string;
  cap_size?: string;
  capSize?: string;
  sizePreference?: string;
}): Promise<SupabaseRegisterResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      code: 'DB_ERROR',
      error: 'Supabase is not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY.',
    };
  }

  const normalizedEmail = normalizeEmail(payload.email);

  // 1. Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return {
      success: false,
      code: 'INVALID_INPUT',
      error: 'A valid email address is required for club registration.',
    };
  }

  const schema = await detectTableSchema();

  try {
    // 2. Enforce 100-registration limit using column-agnostic head count
    let currentTotal = 0;
    const { count, error: countError } = await supabase
      .from(schema.tableName)
      .select('*', { count: 'exact', head: true });

    if (!countError && typeof count === 'number') {
      currentTotal = count;
    }

    if (currentTotal >= MAX_SUPABASE_REGISTRATIONS) {
      return {
        success: false,
        code: 'CAPACITY_REACHED',
        error: 'THE CLUB allocation is fully booked. All 100 member slots for Drop 01 have been claimed.',
        totalCount: currentTotal,
      };
    }

    // 3. Pre-check email existence using the detected column case (e.g. 'EMAIL' or 'email')
    const { data: rowsFound, error: dupCheckError } = await supabase
      .from(schema.tableName)
      .select(schema.emailCol)
      .ilike(schema.emailCol, normalizedEmail)
      .limit(1);

    if (!dupCheckError && rowsFound && rowsFound.length > 0) {
      return {
        success: false,
        code: 'DUPLICATE_EMAIL',
        error: 'This email is already registered.',
        totalCount: currentTotal,
      };
    }

    // 4. Extract individual size values
    const effectiveTShirtSize = (
      payload.tshirt_size ||
      payload.tshirtSize ||
      payload.shirt_size ||
      payload.sizePreference ||
      'M (Oversized)'
    ).trim();

    const effectivePantSize = (
      payload.denim_jeans_size ||
      payload.pant_size ||
      payload.pantSize ||
      '32 (Wide)'
    ).trim();

    const effectiveCapSize = (
      payload.cap_size ||
      payload.capSize ||
      'One Size (Adjustable)'
    ).trim();

    // 5. Build insert payload dynamically based on detected schema columns
    const insertPayload: Record<string, any> = {
      [schema.nameCol]: payload.name?.trim() || null,
      [schema.emailCol]: normalizedEmail,
      [schema.phoneCol]: payload.phone?.trim() || null,
    };

    // T-shirt size column (T_SHIRT_SIZE or legacy SHIRT_SIZE)
    if (schema.tShirtSizeCol) {
      insertPayload[schema.tShirtSizeCol] = effectiveTShirtSize;
    } else if (schema.shirtSizeCol) {
      insertPayload[schema.shirtSizeCol] = effectiveTShirtSize;
    }

    // CAP_SIZE column if present
    if (schema.capSizeCol) {
      insertPayload[schema.capSizeCol] = effectiveCapSize;
    }

    // DENIM_JEANS_SIZE column if present
    if (schema.denimJeansSizeCol) {
      insertPayload[schema.denimJeansSizeCol] = effectivePantSize;
    }

    let insertResult = await supabase
      .from(schema.tableName)
      .insert([insertPayload])
      .select();

    // If .select() failed with RLS (42501), retry with plain insert without .select()
    if (insertResult.error && insertResult.error.code === '42501') {
      const plainInsert = await supabase
        .from(schema.tableName)
        .insert([insertPayload]);

      if (!plainInsert.error) {
        insertResult = {
          data: [{
            ...insertPayload,
            [schema.idCol]: currentTotal + 1,
            [schema.createdAtCol]: new Date().toISOString(),
          }],
          error: null,
          count: null,
          status: 201,
          statusText: 'Created',
        } as any;
      }
    }

    // Handle duplicate error from Postgres unique constraint
    if (insertResult.error) {
      const err = insertResult.error;
      console.warn(`[Supabase insert response (${err.code})]:`, err.message);

      if (
        err.code === '23505' ||
        err.message?.toLowerCase().includes('duplicate') ||
        err.message?.toLowerCase().includes('unique') ||
        err.details?.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          code: 'DUPLICATE_EMAIL',
          error: 'This email is already registered.',
          totalCount: currentTotal,
        };
      }

      // If RLS policy is restricting direct anon insert on the table
      if (err.code === '42501') {
        console.warn('[Supabase RLS Active]: Row-level security prevented direct anon insert.');
        return {
          success: false,
          code: 'RLS_RESTRICTION',
          error: 'Database RLS policy active. Please add an INSERT policy on CLUB_REGISTRATIONS in Supabase SQL editor.',
          totalCount: currentTotal,
        };
      }

      return {
        success: false,
        code: 'DB_ERROR',
        error: err.message || 'Database error occurred while registering member.',
        totalCount: currentTotal,
      };
    }

    const insertedRow = insertResult.data && insertResult.data[0] ? insertResult.data[0] : null;
    const nextPosition = currentTotal + 1;

    return {
      success: true,
      record: insertedRow,
      positionNumber: nextPosition,
      totalCount: nextPosition,
    };
  } catch (err: any) {
    console.error('[Supabase Exception]:', err);
    return {
      success: false,
      code: 'DB_ERROR',
      error: err.message || 'Unexpected database error.',
    };
  }
}

/**
 * Fetches total count from Supabase using column-agnostic head query
 */
export async function getSupabaseCount(): Promise<number | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const schema = await detectTableSchema();
  try {
    const { count, error } = await supabase
      .from(schema.tableName)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.warn('[getSupabaseCount error]:', error.message);
      return null;
    }
    return count;
  } catch (e) {
    return null;
  }
}

/**
 * Fetches all registrations from Supabase
 */
export async function getAllFromSupabase(): Promise<any[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const schema = await detectTableSchema();
  try {
    const { data, error } = await supabase
      .from(schema.tableName)
      .select('*')
      .order(schema.createdAtCol, { ascending: false });

    if (error) {
      // Fallback without ordering in case column differs
      const fallback = await supabase.from(schema.tableName).select('*');
      return fallback.data || null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Deletes a registration from Supabase by ID or normalized email
 */
export async function deleteFromSupabase(idOrEmail: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const schema = await detectTableSchema();
  const normalized = normalizeEmail(idOrEmail);

  try {
    let query = supabase.from(schema.tableName).delete();
    if (idOrEmail.includes('@')) {
      query = query.ilike(schema.emailCol, normalized);
    } else {
      query = query.eq(schema.idCol, idOrEmail);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Deletes all registrations from Supabase
 */
export async function clearAllFromSupabase(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const schema = await detectTableSchema();
  try {
    const { error } = await supabase
      .from(schema.tableName)
      .delete()
      .neq(schema.emailCol, 'never_match_placeholder_address_xyz@nonexistent.domain');
    return !error;
  } catch (e) {
    return false;
  }
}
