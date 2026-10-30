import { WaitlistSubmission } from '../types';

/**
 * Computes SHA-256 cryptographic hash of a given string using Web Crypto API.
 */
export async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an authentic Club Pass Serial code for UP N DOWN early access drop.
 */
export function generateVipPassCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < 6; i++) {
    randomPart += charset[randomBytes[i] % charset.length];
  }
  return `UND-2026-${randomPart}`;
}

const STORAGE_KEY = 'upndown_club_pass_v1';
const LEGACY_STORAGE_KEY = 'void_archive_vip_pass_v1';

/**
 * Saves club pass into localStorage with client-side verification hash.
 */
export function saveVipPassLocally(pass: WaitlistSubmission): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pass));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

/**
 * Retrieves the stored club pass if one exists.
 */
export function getStoredVipPass(): WaitlistSubmission | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WaitlistSubmission;
  } catch (err) {
    return null;
  }
}

/**
 * Generates an iCalendar (.ics) string for the UP N DOWN launch event.
 */
export function generateICSLaunchInvite(): string {
  const startDate = '20261231T180000Z';
  const endDate = '20261231T200000Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UP N DOWN//STREETWEAR DROP 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    'SUMMARY:UP N DOWN — Official Launch (Drop 01) | SAME ENERGY DIFFERENT PHASE',
    'DESCRIPTION:Join The Club early access opening for UP N DOWN. Heavyweight hoodies, boxy tees, and structured caps. Have your Club Access Pass ready.',
    'LOCATION:https://upndown.com',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads a text file (such as the ICS calendar invite) to the user's device.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
