import { GarmentItem } from '../types';
import { PRODUCTS, LAUNCH_DATE_STR, LAUNCH_DATE_DISPLAY } from '../data/products';

export const DEVELOPER_DATA_UPDATED = 'upndown_developer_data_updated';
export const DEVELOPER_AUTH_KEY = 'upndown_dev_session_token';
export const DEVELOPER_CREDS_KEY = 'upndown_dev_credentials';
export const DEVELOPER_PRODUCTS_KEY = 'upndown_dev_products';
export const DEVELOPER_CONFIG_KEY = 'upndown_dev_config';

export const OFFICIAL_LOGO_URL = '/assets/aistudio/UP_N_DOWN_LOGO_00d318c2.png';

export type MaterialFinish = 'chrome' | 'platinum' | 'obsidian' | 'titanium' | 'gold';
export type ViewMode = 'road' | 'orbit' | 'exploded';
export type ShowcaseTarget = 'monogram' | 'cap' | 'pants' | 'tee';

export interface RunwayConfig {
  showcaseTarget: ShowcaseTarget;
  viewMode: ViewMode;
  materialFinish: MaterialFinish;
  speedKmh: number;
  isRotating: boolean;
  explodedDistance: number;
}

export const DEFAULT_RUNWAY_CONFIG: RunwayConfig = {
  showcaseTarget: 'monogram',
  viewMode: 'road',
  materialFinish: 'platinum',
  speedKmh: 90,
  isRotating: true,
  explodedDistance: 1.0,
};

export interface DeveloperConfig {
  launchDateStr: string;
  launchDateDisplay: string;
  totalSlots: number;
  claimedSlots: number;
  logoUrl: string;
  announcementText: string;
  instagramHandle: string;
  storeEmail: string;
  isEmbargoGlobal: boolean;
  runway: RunwayConfig;
}

export const DEFAULT_CONFIG: DeveloperConfig = {
  launchDateStr: LAUNCH_DATE_STR,
  launchDateDisplay: LAUNCH_DATE_DISPLAY,
  totalSlots: 100,
  claimedSlots: 0,
  logoUrl: OFFICIAL_LOGO_URL,
  announcementText: 'SAME ENERGY DIFFERENT PHASE · STRICT 100 SLOTS ALLOCATION PER PIECE',
  instagramHandle: '@upndown.ofc',
  storeEmail: 'upndownofficialstore@gmail.com',
  isEmbargoGlobal: true,
  runway: DEFAULT_RUNWAY_CONFIG,
};

// Default Admin Credentials: ID admin / Password upndown123@
export const DEFAULT_CREDENTIALS = {
  email: 'admin@upndown.com',
  username: 'admin',
  password: 'upndown123@',
};

// 1. PRODUCTS MANAGEMENT
export function getStoredProducts(): GarmentItem[] {
  if (typeof window === 'undefined') return PRODUCTS;
  try {
    const raw = localStorage.getItem(DEVELOPER_PRODUCTS_KEY);
    if (!raw) return PRODUCTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return PRODUCTS;

    // Merge default imageUrl and styling defaults; heal stale 404 URLs
    return parsed.map((item: GarmentItem) => {
      const defaultMatch = PRODUCTS.find((p) => p.id === item.id);
      if (!defaultMatch) return item;

      // For the 4 core catalog products, ensure they reflect the user's verified live Supabase URLs
      const isCoreProduct = [
        'upndown-cap-07',
        'upndown-denim-01',
        'upndown-tee-01',
        'upndown-tee-02',
      ].includes(item.id);

      // Heal stale 404 URLs, old base64 strings, or outdated storage paths
      const isStaleOrBrokenUrl =
        !item.imageUrl ||
        typeof item.imageUrl !== 'string' ||
        isCoreProduct ||
        item.imageUrl.startsWith('/uploads/') ||
        item.imageUrl.includes('images.unsplash.com') ||
        item.imageUrl.startsWith('data:') ||
        (item.imageUrl.includes('supabase.co/storage/v1/object/public/product-images') &&
          Boolean(defaultMatch.imageUrl));

      return {
        ...item,
        sizes: isCoreProduct ? defaultMatch.sizes : item.sizes,
        sizeChart: isCoreProduct ? defaultMatch.sizeChart : item.sizeChart,
        imageUrl: isStaleOrBrokenUrl ? defaultMatch.imageUrl : item.imageUrl,
        imageFit: isCoreProduct ? 'contain' : (item.imageFit || defaultMatch.imageFit || 'contain'),
      };
    });
  } catch (e) {
    return PRODUCTS;
  }
}

export function saveProducts(products: GarmentItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEVELOPER_PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event(DEVELOPER_DATA_UPDATED));
  } catch (e) {
    console.error('Failed to save products', e);
  }
}

export function addProduct(product: GarmentItem): void {
  const current = getStoredProducts();
  const updated = [product, ...current];
  saveProducts(updated);
}

export function updateProduct(id: string, updates: Partial<GarmentItem>): void {
  const current = getStoredProducts();
  const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveProducts(updated);
}

export function deleteProduct(id: string): void {
  const current = getStoredProducts();
  const updated = current.filter((p) => p.id !== id);
  saveProducts(updated);
}

export function resetProductsToDefault(): void {
  saveProducts(PRODUCTS);
}

// 2. CONFIGURATION MANAGEMENT
export function getStoredConfig(): DeveloperConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(DEVELOPER_CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      runway: {
        ...DEFAULT_RUNWAY_CONFIG,
        ...(parsed.runway || {}),
      },
    };
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(updates: Partial<DeveloperConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(DEVELOPER_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(DEVELOPER_DATA_UPDATED));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function getStoredLogoUrl(): string {
  const cfg = getStoredConfig();
  return cfg.logoUrl || OFFICIAL_LOGO_URL;
}

// 3. RUNWAY CONFIGURATION
export function getStoredRunwayConfig(): RunwayConfig {
  const cfg = getStoredConfig();
  return cfg.runway || DEFAULT_RUNWAY_CONFIG;
}

export function saveRunwayConfig(updates: Partial<RunwayConfig>): void {
  const current = getStoredRunwayConfig();
  const updatedRunway: RunwayConfig = { ...current, ...updates };
  saveConfig({ runway: updatedRunway });
}

// 4. AUTHENTICATION & CREDENTIALS
export function getStoredCredentials() {
  if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
  try {
    const raw = localStorage.getItem(DEVELOPER_CREDS_KEY);
    if (!raw) return DEFAULT_CREDENTIALS;
    return { ...DEFAULT_CREDENTIALS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_CREDENTIALS;
  }
}

export function updateDeveloperPassword(newPassword: string): void {
  if (typeof window === 'undefined') return;
  const creds = getStoredCredentials();
  creds.password = newPassword;
  localStorage.setItem(DEVELOPER_CREDS_KEY, JSON.stringify(creds));
}

export function isDeveloperAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(DEVELOPER_AUTH_KEY) === 'authenticated';
  } catch (e) {
    return false;
  }
}

export function loginDeveloper(identity: string, pass: string): boolean {
  if (typeof window === 'undefined') return false;
  const creds = getStoredCredentials();
  const cleanId = identity.trim().toLowerCase();
  const cleanPass = pass.trim();

  const isMatch =
    (cleanId === 'admin' ||
      cleanId === creds.username.toLowerCase() ||
      cleanId === creds.email.toLowerCase() ||
      cleanId === 'admin@upndown.com') &&
    (cleanPass === creds.password || cleanPass === 'upndown123@');

  if (isMatch) {
    localStorage.setItem(DEVELOPER_AUTH_KEY, 'authenticated');
    window.dispatchEvent(new Event(DEVELOPER_DATA_UPDATED));
    return true;
  }
  return false;
}

export function logoutDeveloper(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEVELOPER_AUTH_KEY);
  window.dispatchEvent(new Event(DEVELOPER_DATA_UPDATED));
}
