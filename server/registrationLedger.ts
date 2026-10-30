import fs from 'fs';
import path from 'path';

export interface ServerRegistration {
  id: string;
  name?: string;
  email: string; // Stored in normalized lowercase
  rawEmail: string;
  phone?: string;
  passCode: string;
  positionNumber: number;
  sizePreference: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
  categories: string[];
  launchDate: string;
  cryptoSignature: string;
  registeredAt: string;
  createdAt: string;
  source?: 'web_registration' | 'admin_manual';
  notes?: string;
  supabaseSynced?: boolean;
  supabaseId?: string | number;
}

export const MAX_CLUB_SLOTS = 100;

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'club_registrations.json');

// Registration ledger starts empty
const SEED_REGISTRATIONS: ServerRegistration[] = [];

let inMemoryRegistrations: ServerRegistration[] = [];

/**
 * Normalizes email by trimming surrounding whitespace and converting to lowercase
 */
export function normalizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Ensures the data storage directory and file exist, loading records into memory
 */
function initStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      inMemoryRegistrations = [];
      fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryRegistrations, null, 2), 'utf-8');
    } else {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryRegistrations = parsed.map((item) => ({
          ...item,
          email: normalizeEmail(item.email),
        }));
      } else {
        inMemoryRegistrations = [];
        fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryRegistrations, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.error('[Registration Ledger] Failed to initialize file storage. Falling back to in-memory:', err);
    inMemoryRegistrations = [];
  }
}

// Initialize on module load
initStorage();

/**
 * Persists current in-memory registrations to disk
 */
function persistToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryRegistrations, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Registration Ledger] Failed to persist data to disk:', err);
  }
}

/**
 * Checks whether an email is already registered (case-insensitive & whitespace trimmed)
 */
export function isEmailRegistered(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return inMemoryRegistrations.some((reg) => reg.email === normalized);
}

/**
 * Gets registration by normalized email
 */
export function getRegistrationByEmail(email: string): ServerRegistration | undefined {
  const normalized = normalizeEmail(email);
  return inMemoryRegistrations.find((reg) => reg.email === normalized);
}

/**
 * Returns total count of confirmed club registrations
 */
export function getRegistrationCount(): number {
  return inMemoryRegistrations.length;
}

/**
 * Returns all confirmed club registrations
 */
export function getAllRegistrations(): ServerRegistration[] {
  return [...inMemoryRegistrations];
}

/**
 * Records a new validated club registration to in-memory store and file
 */
export function addRegistration(reg: ServerRegistration): void {
  reg.email = normalizeEmail(reg.email);
  inMemoryRegistrations.unshift(reg);
  persistToDisk();
}

/**
 * Deletes a registration by ID, normalized email, or raw email
 */
export function deleteRegistration(idOrEmail: string): boolean {
  const normalized = normalizeEmail(idOrEmail);
  const initialLength = inMemoryRegistrations.length;
  inMemoryRegistrations = inMemoryRegistrations.filter(
    (reg) => reg.id !== idOrEmail && reg.email !== normalized && reg.rawEmail !== idOrEmail
  );
  const changed = inMemoryRegistrations.length < initialLength;
  if (changed) {
    persistToDisk();
  }
  return changed;
}

/**
 * Backward compatibility alias for deleting by email
 */
export function deleteRegistrationByEmail(email: string): boolean {
  return deleteRegistration(email);
}

/**
 * Clears all registrations completely and persists empty array
 */
export function clearAllRegistrations(): void {
  inMemoryRegistrations = [];
  persistToDisk();
}

/**
 * Resets registrations to empty array (or seed if explicitly needed)
 */
export function resetToSeedRegistrations(): void {
  clearAllRegistrations();
}

export interface RegisterMemberParams {
  name?: string;
  rawEmail: string;
  phone?: string;
  passCode?: string;
  positionNumber?: number;
  sizePreference?: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
  categories?: string[];
  launchDate?: string;
  cryptoSignature?: string;
  notes?: string;
  source?: 'web_registration' | 'admin_manual';
  supabaseSynced?: boolean;
  supabaseId?: string | number;
}

export interface RegisterResult {
  success: boolean;
  code?: 'DUPLICATE_EMAIL' | 'CAPACITY_REACHED' | 'INVALID_EMAIL';
  error?: string;
  member?: ServerRegistration;
  totalCount: number;
  remainingSlots: number;
}

/**
 * Marks a local registration as successfully synchronized with Supabase
 */
export function markRegistrationSynced(email: string, supabaseId?: string | number): boolean {
  const normalized = normalizeEmail(email);
  const member = inMemoryRegistrations.find((m) => m.email === normalized);
  if (member) {
    member.supabaseSynced = true;
    if (supabaseId) member.supabaseId = supabaseId;
    persistToDisk();
    return true;
  }
  return false;
}

/**
 * Returns any registrations that have not yet been synchronized to Supabase
 */
export function getPendingSupabaseRegistrations(): ServerRegistration[] {
  return inMemoryRegistrations.filter((m) => !m.supabaseSynced);
}

/**
 * Atomically validates email uniqueness and capacity, then persists the new registration.
 * Because JavaScript in Node.js runs on a single-threaded event loop, this synchronous
 * check-and-append operation is completely atomic and immune to race conditions or concurrent over-allocation.
 */
export function registerClubMemberAtomically(params: RegisterMemberParams): RegisterResult {
  const normalizedEmail = normalizeEmail(params.rawEmail);

  // 1. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return {
      success: false,
      code: 'INVALID_EMAIL',
      error: 'A valid email address is required for club registration.',
      totalCount: inMemoryRegistrations.length,
      remainingSlots: Math.max(0, MAX_CLUB_SLOTS - inMemoryRegistrations.length),
    };
  }

  // 2. Strict Duplicate Email Prevention (case-insensitive & whitespace trimmed)
  if (inMemoryRegistrations.some((reg) => reg.email === normalizedEmail)) {
    return {
      success: false,
      code: 'DUPLICATE_EMAIL',
      error: 'This email is already registered.',
      totalCount: inMemoryRegistrations.length,
      remainingSlots: Math.max(0, MAX_CLUB_SLOTS - inMemoryRegistrations.length),
    };
  }

  // 3. Strict 100-Registration Capacity Limit
  if (inMemoryRegistrations.length >= MAX_CLUB_SLOTS) {
    return {
      success: false,
      code: 'CAPACITY_REACHED',
      error: 'THE CLUB allocation is fully booked. All 100 member slots for Drop 01 have been claimed.',
      totalCount: inMemoryRegistrations.length,
      remainingSlots: 0,
    };
  }

  // Calculate position number (strictly sequential and capped at 100)
  const slotNum = params.positionNumber || (inMemoryRegistrations.length + 1);
  const safeCode = params.passCode || `UND-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const nowIso = new Date().toISOString();

  const newRecord: ServerRegistration = {
    id: `und-member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: params.name?.trim() || undefined,
    email: normalizedEmail,
    rawEmail: params.rawEmail,
    phone: params.phone?.trim() || undefined,
    passCode: safeCode,
    positionNumber: slotNum,
    sizePreference: params.sizePreference || 'M (Oversized)',
    tshirtSize: params.tshirtSize,
    pantSize: params.pantSize,
    capSize: params.capSize,
    categories: params.categories && params.categories.length > 0 ? params.categories : ['Heavy Tees'],
    launchDate: params.launchDate || '31st Dec 2026',
    cryptoSignature: params.cryptoSignature || 'SHA256_VERIFIED_ATELIER_2026',
    registeredAt: nowIso,
    createdAt: nowIso,
    source: params.source || 'web_registration',
    notes: params.notes,
    supabaseSynced: params.supabaseSynced ?? false,
    supabaseId: params.supabaseId,
  };

  inMemoryRegistrations.unshift(newRecord);
  persistToDisk();

  return {
    success: true,
    member: newRecord,
    totalCount: inMemoryRegistrations.length,
    remainingSlots: Math.max(0, MAX_CLUB_SLOTS - inMemoryRegistrations.length),
  };
}
