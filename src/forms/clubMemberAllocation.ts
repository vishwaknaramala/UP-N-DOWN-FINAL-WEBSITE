import { WaitlistSubmission } from '../types';
import { getStoredConfig, saveConfig, DEVELOPER_DATA_UPDATED } from '../utils/developerStorage';
import { dispatchLiveClubEmail, EmailDeliveryReceipt } from './emailDispatchService';
import { sha256Hex, generateVipPassCode, saveVipPassLocally } from '../utils/crypto';
import { LAUNCH_DATE_DISPLAY } from '../data/products';

export interface ClubMemberRecord {
  id: string;
  name?: string;
  positionNumber: number;
  email: string;
  phone?: string;
  sizePreference: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
  categories: string[];
  passCode: string;
  cryptoSignature: string;
  createdAt: string;
  registeredAt?: string;
  launchDate: string;
  emailDispatched: boolean;
  emailDispatchedAt?: string;
  source: 'web_registration' | 'admin_manual';
  notes?: string;
}

const MEMBERS_LEDGER_KEY = 'upndown_club_members_ledger_v2';
const FORMS_FOLDER_KEY = 'upndown_forms_database_folder_url';

export const DEFAULT_FORMS_FOLDER_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc_UP_N_DOWN_Atelier_Club_Ledger_2026/viewform';

// Club members default to empty array
const SEED_MEMBERS: ClubMemberRecord[] = [];

/**
 * Retrieves all registered club members from local persistent storage
 */
export function getStoredClubMembers(): ClubMemberRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MEMBERS_LEDGER_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Synchronizes local member ledger with authoritative backend database
 */
export async function syncClubMembersWithBackend(): Promise<ClubMemberRecord[]> {
  if (typeof window === 'undefined') return getStoredClubMembers();
  try {
    const res = await fetch('/api/club-registrations');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.registrations)) {
        const serverMembers: ClubMemberRecord[] = data.registrations.map((r: any) => ({
          id: r.id || `und-reg-${r.positionNumber}`,
          name: r.name || undefined,
          positionNumber: Number(r.positionNumber) || 1,
          email: r.email,
          phone: r.phone || undefined,
          sizePreference: r.sizePreference || 'M (Oversized)',
          tshirtSize: r.tshirtSize || undefined,
          pantSize: r.pantSize || undefined,
          capSize: r.capSize || undefined,
          categories: Array.isArray(r.categories) && r.categories.length > 0 ? r.categories : ['Heavy Tees'],
          passCode: r.passCode || 'UND-2026-VIP',
          cryptoSignature: r.cryptoSignature || 'SHA256_VERIFIED_ATELIER_2026',
          createdAt: r.createdAt || r.registeredAt || new Date().toISOString(),
          registeredAt: r.registeredAt || r.createdAt,
          launchDate: r.launchDate || LAUNCH_DATE_DISPLAY,
          emailDispatched: true,
          emailDispatchedAt: r.registeredAt || r.createdAt,
          source: (r.source || 'web_registration') as 'web_registration' | 'admin_manual',
          notes: r.notes || undefined,
        }));

        saveClubMembers(serverMembers);
        saveConfig({ claimedSlots: serverMembers.length });
        return serverMembers;
      }
    }
  } catch (e) {
    // Non-fatal if offline
  }
  return getStoredClubMembers();
}

/**
 * Saves all club members and notifies reactive listeners
 */
export function saveClubMembers(members: ClubMemberRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMBERS_LEDGER_KEY, JSON.stringify(members));
    window.dispatchEvent(new Event(DEVELOPER_DATA_UPDATED));
  } catch (e) {
    console.error('Failed to save club members ledger', e);
  }
}

/**
 * Retrieves the linked Forms or Database Folder URL
 */
export function getStoredFormsFolderUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_FORMS_FOLDER_URL;
  try {
    return localStorage.getItem(FORMS_FOLDER_KEY) || DEFAULT_FORMS_FOLDER_URL;
  } catch (e) {
    return DEFAULT_FORMS_FOLDER_URL;
  }
}

/**
 * Updates the linked Forms or Database Folder URL
 */
export function saveFormsFolderUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FORMS_FOLDER_KEY, url.trim());
    window.dispatchEvent(new Event(DEVELOPER_DATA_UPDATED));
  } catch (e) {
    console.error('Failed to save forms folder URL', e);
  }
}

/**
 * Normalizes email by trimming surrounding whitespace and converting to lowercase
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Checks whether an email is already registered locally
 */
export function isClubEmailRegistered(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getStoredClubMembers().some((m) => normalizeEmail(m.email) === normalized);
}

/**
 * Allocates a new member live, dispatches real-time email, and increments global claimed counter
 */
export async function allocateNewClubMember(payload: {
  name?: string;
  email: string;
  phone?: string;
  sizePreference: string;
  tshirtSize?: string;
  pantSize?: string;
  capSize?: string;
  categories: string[];
  source?: 'web_registration' | 'admin_manual';
  notes?: string;
}): Promise<{ member: ClubMemberRecord; emailReceipt: EmailDeliveryReceipt }> {
  const currentMembers = getStoredClubMembers();
  const config = getStoredConfig();
  const normalizedEmail = normalizeEmail(payload.email);

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('A valid email address is required for club registration.');
  }

  // 1. Client-Side Duplicate Prevention Check
  if (currentMembers.some((m) => normalizeEmail(m.email) === normalizedEmail)) {
    throw new Error('This email is already registered.');
  }

  // 2. Client-Side 100-Capacity Limit Check
  if (config.claimedSlots >= config.totalSlots) {
    throw new Error('THE CLUB allocation is fully booked. All 100 member slots for Drop 01 have been claimed.');
  }

  // Next slot calculation (capped at totalSlots e.g. 100)
  const nextPosition = Math.min(config.claimedSlots + 1, config.totalSlots);
  const code = generateVipPassCode();
  const timestamp = new Date().toISOString();
  const rawPayload = `${normalizedEmail}:${payload.phone || ''}:${payload.sizePreference}:${code}:${timestamp}`;
  const signature = await sha256Hex(rawPayload);

  // 3. Dispatch to backend (which runs authoritative backend validation & sends Resend emails)
  // If backend rejects as duplicate (409) or capacity full (400), this throws and aborts!
  const emailReceipt = await dispatchLiveClubEmail({
    name: payload.name?.trim(),
    email: normalizedEmail,
    phone: payload.phone?.trim(),
    passCode: code,
    positionNumber: nextPosition,
    sizePreference: payload.sizePreference,
    tshirtSize: payload.tshirtSize,
    pantSize: payload.pantSize,
    capSize: payload.capSize,
    shirt_size: payload.sizePreference,
    categories: payload.categories,
    launchDate: LAUNCH_DATE_DISPLAY,
    cryptoSignature: signature,
    notes: payload.notes,
  });

  const newMember: ClubMemberRecord = {
    id: `und-member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: payload.name?.trim(),
    positionNumber: nextPosition,
    email: normalizedEmail,
    phone: payload.phone?.trim(),
    sizePreference: payload.sizePreference,
    tshirtSize: payload.tshirtSize,
    pantSize: payload.pantSize,
    capSize: payload.capSize,
    categories: payload.categories,
    passCode: code,
    cryptoSignature: signature,
    createdAt: timestamp,
    launchDate: LAUNCH_DATE_DISPLAY,
    emailDispatched: true,
    emailDispatchedAt: emailReceipt.dispatchedAt,
    source: payload.source || 'web_registration',
    notes: payload.notes,
  };

  // Prepend to member records
  const updatedMembers = [newMember, ...currentMembers];
  saveClubMembers(updatedMembers);

  // Update global slot counter in config
  saveConfig({
    claimedSlots: Math.min(config.claimedSlots + 1, config.totalSlots),
  });

  // Also update standard local VIP pass storage for this browser user
  const waitlistPass: WaitlistSubmission = {
    id: newMember.id,
    name: newMember.name,
    email: newMember.email,
    phone: newMember.phone,
    sizePreference: newMember.sizePreference,
    categories: newMember.categories,
    passCode: newMember.passCode,
    cryptoSignature: newMember.cryptoSignature,
    positionNumber: newMember.positionNumber,
    createdAt: newMember.createdAt,
    launchDate: newMember.launchDate,
  };
  saveVipPassLocally(waitlistPass);

  return { member: newMember, emailReceipt };
}

/**
 * Deletes a member from the database, updates slot count, and notifies backend
 */
export async function deleteClubMember(id: string): Promise<ClubMemberRecord[]> {
  const current = getStoredClubMembers();
  const target = current.find((m) => m.id === id);
  const updated = current.filter((m) => m.id !== id);
  saveClubMembers(updated);
  saveConfig({ claimedSlots: updated.length });

  const identifier = target?.email ? normalizeEmail(target.email) : id;
  try {
    await fetch(`/api/club-registrations/${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
    });
    if (target?.id && target.id !== identifier) {
      await fetch(`/api/club-registrations/${encodeURIComponent(target.id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
  } catch (e) {
    // Non-fatal if offline
  }

  return updated;
}

/**
 * Resends live confirmation email to a registered member
 */
export async function resendMemberEmail(memberId: string): Promise<boolean> {
  const current = getStoredClubMembers();
  const member = current.find((m) => m.id === memberId);
  if (!member) return false;

  await dispatchLiveClubEmail({
    name: member.name,
    email: member.email,
    phone: member.phone,
    passCode: member.passCode,
    positionNumber: member.positionNumber,
    sizePreference: member.sizePreference,
    categories: member.categories,
    launchDate: member.launchDate,
    cryptoSignature: member.cryptoSignature,
    notes: member.notes,
  });

  const updated = current.map((m) =>
    m.id === memberId
      ? { ...m, emailDispatched: true, emailDispatchedAt: new Date().toISOString() }
      : m
  );
  saveClubMembers(updated);
  return true;
}

/**
 * Exports all members to CSV format
 */
export function exportMembersToCsv(): string {
  const members = getStoredClubMembers();
  const headers = [
    'Slot #',
    'Customer Name',
    'Email',
    'Phone',
    'Size Preference',
    'Garment Categories',
    'Pass Code',
    'Registration Date',
    'Email Status',
    'Crypto Hash',
  ];

  const rows = members.map((m) => [
    m.positionNumber,
    `"${m.name || 'N/A'}"`,
    `"${m.email}"`,
    `"${m.phone || 'N/A'}"`,
    `"${m.sizePreference}"`,
    `"${m.categories.join(', ')}"`,
    `"${m.passCode}"`,
    `"${new Date(m.createdAt).toLocaleString()}"`,
    `"${m.emailDispatched ? 'Dispatched' : 'Pending'}"`,
    `"${m.cryptoSignature}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Permanently clears and deletes ALL club members locally and on the backend database
 */
export async function clearAllClubMembers(): Promise<void> {
  saveClubMembers([]);
  saveConfig({ claimedSlots: 0 });
  try {
    await fetch('/api/club-registrations/clear', { method: 'POST' });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Clears and resets member ledger to 0
 */
export async function resetClubMembers(): Promise<void> {
  await clearAllClubMembers();
}
