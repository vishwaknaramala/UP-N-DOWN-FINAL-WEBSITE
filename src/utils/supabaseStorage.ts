/**
 * Supabase Storage Utilities for UP N DOWN
 * Bucket: prodct-images
 * Base URL: https://uwoyznudoiwjttoxnptr.supabase.co
 */

import { GarmentItem } from '../types';
import { USER_UPLOADED_PRODUCT_IMAGES, SUPABASE_PRODUCT_IMAGE_URLS } from '../data/uploadedProductImages';

export const SUPABASE_STORAGE_BUCKET = 'prodct-images';
export const DEFAULT_SUPABASE_PROJECT_URL = 'https://uwoyznudoiwjttoxnptr.supabase.co';

/**
 * Standard verified luxury lookbook photography CDN URLs (exact live Supabase Storage URLs)
 */
export const VERIFIED_PRODUCT_CDN_IMAGES: Record<string, string> = {
  'upndown-cap-07': SUPABASE_PRODUCT_IMAGE_URLS.cap,
  'upndown-denim-01': SUPABASE_PRODUCT_IMAGE_URLS.denim,
  'upndown-tee-01': SUPABASE_PRODUCT_IMAGE_URLS.tee01,
  'upndown-tee-02': SUPABASE_PRODUCT_IMAGE_URLS.tee02,
};

/**
 * Standard default image URL candidates for core drop products in bucket prodct-images
 */
export const DEFAULT_PRODUCT_STORAGE_FILENAMES: Record<string, string> = {
  'upndown-cap-07': 'CAP.jpeg',
  'upndown-denim-01': 'BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg',
  'upndown-tee-01': 'BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg',
  'upndown-tee-02': 'BEIGE%20HAND%20T%20SHIRT.jpeg',
};

/**
 * Returns the cleaned base URL for Supabase (without trailing slashes or /rest/v1)
 */
export function getSupabaseBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const raw = envUrl && envUrl.length > 5 ? envUrl : DEFAULT_SUPABASE_PROJECT_URL;
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * Constructs the canonical public URL for an object stored in the prodct-images bucket
 */
export function getSupabasePublicUrlForPath(pathOrFilename: string, bucket = SUPABASE_STORAGE_BUCKET): string {
  const cleanPath = pathOrFilename.replace(/^\/+/, '');
  const baseUrl = getSupabaseBaseUrl();
  return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/**
 * Resolves any product image reference to an absolute displayable URL.
 * Supports:
 * - Exact user-uploaded images from prodct-images bucket
 * - Direct Supabase URLs (returns as-is)
 * - Filenames / paths inside 'prodct-images' (e.g. "CAP.jpeg")
 * - Core product IDs ('upndown-cap-07', 'upndown-denim-01', etc.)
 * - Remote URLs (https://...)
 * - Local /uploads/ paths
 * - Base64 data URLs
 */
export function getSupabaseProductImageUrl(imageUrlOrPath?: string | null): string {
  if (!imageUrlOrPath) return '';
  const trimmed = imageUrlOrPath.trim();
  if (!trimmed) return '';

  // 1. Direct match in dictionary of user-uploaded images
  if (USER_UPLOADED_PRODUCT_IMAGES[trimmed]) {
    return USER_UPLOADED_PRODUCT_IMAGES[trimmed];
  }

  // 2. Direct match in verified CDN dictionary by product ID
  if (VERIFIED_PRODUCT_CDN_IMAGES[trimmed]) {
    return VERIFIED_PRODUCT_CDN_IMAGES[trimmed];
  }

  // 3. Check clean filename without extension
  const cleanName = trimmed.replace(/\.[^/.]+$/, '');
  if (USER_UPLOADED_PRODUCT_IMAGES[cleanName]) {
    return USER_UPLOADED_PRODUCT_IMAGES[cleanName];
  }

  // 4. Already a full data or blob URL
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 5. Direct server API stream or proxy URL (e.g. /api/product-image/...)
  if (trimmed.startsWith('/api/')) {
    return trimmed;
  }

  // 6. Already a live Supabase Storage URL
  if (
    trimmed.includes('/storage/v1/object/public/prodct-images/') ||
    trimmed.includes('/storage/v1/object/public/product-images/')
  ) {
    return encodeURI(trimmed).replace(/%2520/g, '%20');
  }

  // 7. Generic remote http/https URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return encodeURI(trimmed).replace(/%2520/g, '%20');
  }

  // 8. Local /uploads/ or /assets/ path
  if (trimmed.startsWith('/uploads/')) {
    const rawName = trimmed.replace('/uploads/', '').replace(/\.[^/.]+$/, '');
    if (USER_UPLOADED_PRODUCT_IMAGES[rawName]) {
      return USER_UPLOADED_PRODUCT_IMAGES[rawName];
    }
    return trimmed;
  }
  if (trimmed.startsWith('/assets/')) {
    return trimmed;
  }

  // 9. Filename matches one of our default products
  if (trimmed === 'upndown-cap-07.jpg' || trimmed === 'CAP.jpeg') {
    return SUPABASE_PRODUCT_IMAGE_URLS.cap;
  }
  if (trimmed === 'upndown-denim-01.jpg' || trimmed.includes('DENIM')) {
    return SUPABASE_PRODUCT_IMAGE_URLS.denim;
  }
  if (trimmed === 'upndown-tee-01.jpg' || trimmed.includes('EYE')) {
    return SUPABASE_PRODUCT_IMAGE_URLS.tee01;
  }
  if (trimmed === 'upndown-tee-02.jpg' || trimmed.includes('HAND')) {
    return SUPABASE_PRODUCT_IMAGE_URLS.tee02;
  }

  return getSupabasePublicUrlForPath(trimmed);
}

/**
 * Returns prioritized fallback URLs for each product to guarantee 100% uptime and visibility
 */
export function getProductImageFallbacks(productIdOrKey: string): string[] {
  const cleanKey = productIdOrKey.replace(/^modal_/, '');

  if (cleanKey === 'upndown-cap-07' || cleanKey === 'CAP.jpeg' || cleanKey.toLowerCase().includes('cap')) {
    return [
      'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/CAP.jpeg',
      '/uploads/upndown-cap-07.jpg',
      '/uploads/CAP.jpeg',
      '/api/product-image/CAP.jpeg',
      '/api/product-image/upndown-cap-07.jpg',
    ];
  }

  if (
    cleanKey === 'upndown-denim-01' ||
    cleanKey.toLowerCase().includes('denim') ||
    cleanKey.toLowerCase().includes('blue')
  ) {
    return [
      'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg',
      '/uploads/upndown-denim-01.jpg',
      '/uploads/BLUE BAGGY FIT DENIM JEANS.jpeg',
      '/api/product-image/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg',
      '/api/product-image/upndown-denim-01.jpg',
    ];
  }

  if (
    cleanKey === 'upndown-tee-01' ||
    cleanKey.toLowerCase().includes('eye') ||
    cleanKey.toLowerCase().includes('black')
  ) {
    return [
      'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg',
      '/uploads/upndown-tee-01.jpg',
      '/uploads/BLACK RED EYE BAGGY FIT T SHIRT.jpeg',
      '/api/product-image/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg',
      '/api/product-image/upndown-tee-01.jpg',
    ];
  }

  if (
    cleanKey === 'upndown-tee-02' ||
    cleanKey.toLowerCase().includes('hand') ||
    cleanKey.toLowerCase().includes('beige') ||
    cleanKey.toLowerCase().includes('bond')
  ) {
    return [
      'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BEIGE%20HAND%20T%20SHIRT.jpeg',
      '/uploads/upndown-tee-02.jpg',
      '/uploads/BEIGE HAND T SHIRT.jpeg',
      '/api/product-image/BEIGE%20HAND%20T%20SHIRT.jpeg',
      '/api/product-image/upndown-tee-02.jpg',
    ];
  }

  return [`/uploads/${cleanKey}.jpg`, `/api/product-image/${cleanKey}`];
}

export function getVerifiedFallbackImageUrl(productId: string): string {
  return VERIFIED_PRODUCT_CDN_IMAGES[productId] || '';
}

export function getDefaultSupabaseProductImageUrl(productId: string): string {
  const filename = DEFAULT_PRODUCT_STORAGE_FILENAMES[productId] || `${productId}.jpg`;
  return getSupabasePublicUrlForPath(filename);
}

export interface SupabaseStorageFileItem {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  size?: number;
  publicUrl: string;
  matchedProductId?: string;
}

export interface SupabaseStorageResponse {
  success: boolean;
  bucket: string;
  publicBaseUrl: string;
  files: SupabaseStorageFileItem[];
  total: number;
  error?: string;
}

/**
 * Fetches the active list of files inside the 'prodct-images' Supabase bucket
 */
export async function fetchSupabaseStorageImages(): Promise<SupabaseStorageResponse> {
  try {
    const res = await fetch('/api/supabase/storage/product-images');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data: SupabaseStorageResponse = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[Supabase Storage Sync Notice]:', err.message);
    const baseUrl = getSupabaseBaseUrl();
    return {
      success: false,
      bucket: SUPABASE_STORAGE_BUCKET,
      publicBaseUrl: `${baseUrl}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}`,
      files: [],
      total: 0,
      error: err.message,
    };
  }
}

/**
 * Attempts to match a storage file to a product by ID, style code, filename, or slug
 */
export function matchFileToProductId(filename: string, products: GarmentItem[]): string | undefined {
  const lower = filename.toLowerCase();

  // Exact mappings for user's files
  if (lower === 'cap.jpeg' || lower === 'cap.jpg' || lower.includes('cap-07')) {
    return 'upndown-cap-07';
  }
  if (lower.includes('blue') && lower.includes('denim')) {
    return 'upndown-denim-01';
  }
  if (lower.includes('black') && (lower.includes('eye') || lower.includes('red'))) {
    return 'upndown-tee-01';
  }
  if (lower.includes('beige') || lower.includes('hand')) {
    return 'upndown-tee-02';
  }

  for (const prod of products) {
    const idLower = prod.id.toLowerCase();
    const styleLower = prod.styleCode.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (
      lower.includes(idLower) ||
      lower.startsWith(idLower) ||
      lower.includes(styleLower)
    ) {
      return prod.id;
    }
  }

  // Generic heuristic fallback
  if (lower.includes('cap') || lower.includes('hat')) {
    return products.find((p) => p.category === 'caps')?.id;
  }
  if (lower.includes('denim') || lower.includes('pant') || lower.includes('jean')) {
    return products.find((p) => p.category === 'pants')?.id;
  }
  if (lower.includes('eye') || lower.includes('celestial')) {
    return 'upndown-tee-01';
  }
  if (lower.includes('bond') || lower.includes('hand') || lower.includes('ivory')) {
    return 'upndown-tee-02';
  }
  return undefined;
}
