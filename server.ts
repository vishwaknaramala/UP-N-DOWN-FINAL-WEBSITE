import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import {
  generateCustomerConfirmationEmail,
  generateOwnerNotificationEmail,
} from './server/emailTemplates.js';
import {
  normalizeEmail,
  isEmailRegistered,
  getRegistrationCount,
  getAllRegistrations,
  addRegistration,
  deleteRegistration,
  deleteRegistrationByEmail,
  clearAllRegistrations,
  registerClubMemberAtomically,
  markRegistrationSynced,
  getPendingSupabaseRegistrations,
  MAX_CLUB_SLOTS,
} from './server/registrationLedger.js';
import {
  isSupabaseConfigured,
  getSupabaseUrl,
  getActiveTableName,
  detectTableSchema,
  isEmailRegisteredInSupabase,
  registerToSupabase,
  getSupabaseCount,
  getAllFromSupabase,
  deleteFromSupabase,
  clearAllFromSupabase,
  getSupabaseClient,
} from './server/supabase.js';

// Load environment variables from .env file with override enabled
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory for product images
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Direct product image stream API route with caching and permissive headers
app.get('/api/product-image/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const decodedId = decodeURIComponent(rawId).trim();
  const safeId = decodedId.replace(/[^a-zA-Z0-9_.\-\s]/g, '');

  const candidateNames = [
    decodedId,
    safeId,
    `${safeId}.jpg`,
    `${safeId}.png`,
    `${safeId}.jpeg`,
    `${safeId}.webp`,
  ];

  // Specific product alias fallbacks
  if (safeId.includes('cap') || safeId === 'CAP.jpeg') {
    candidateNames.push('CAP.jpeg', 'upndown-cap-07.jpg');
  } else if (safeId.includes('denim') || safeId.includes('BLUE')) {
    candidateNames.push('BLUE BAGGY FIT DENIM JEANS.jpeg', 'upndown-denim-01.jpg');
  } else if (safeId.includes('eye') || safeId.includes('BLACK')) {
    candidateNames.push('BLACK RED EYE BAGGY FIT T SHIRT.jpeg', 'upndown-tee-01.jpg');
  } else if (safeId.includes('hand') || safeId.includes('BEIGE')) {
    candidateNames.push('BEIGE HAND T SHIRT.jpeg', 'upndown-tee-02.jpg');
  }

  for (const name of candidateNames) {
    const filePath = path.join(uploadsDir, name);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(name).toLowerCase();
      res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(filePath);
    }
  }
  return res.status(404).json({ error: 'Product image not found' });
});

// Resend Configuration from Server Environment Variables
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || '';
// If container has unverified onboarding@resend.dev, override to the verified upndownstore.in domain
const rawFromEmail = process.env.RESEND_FROM_EMAIL?.trim() || '';
const RESEND_FROM_EMAIL = (rawFromEmail && rawFromEmail !== 'onboarding@resend.dev')
  ? rawFromEmail
  : 'club@upndownstore.in';
const OWNER_NOTIFICATION_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL?.trim() || 'upndownofficialstore@gmail.com';

// Format sender header with brand label and verified domain address
function getSenderString(brandLabel: string, sender: string): string {
  if (sender.includes('<') && sender.includes('>')) {
    return sender;
  }
  return `${brandLabel} <${sender}>`;
}

// Initialize Resend Client if key is available
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;


// ==========================================
// 1. Health & Config Status API
// ==========================================
app.get('/api/email-status', (_req: Request, res: Response) => {
  const isConfigured = Boolean(RESEND_API_KEY && RESEND_API_KEY.length > 5);
  res.json({
    configured: isConfigured,
    fromEmail: RESEND_FROM_EMAIL,
    verifiedDomain: 'upndownstore.in',
    ownerEmail: OWNER_NOTIFICATION_EMAIL,
    keyPrefix: isConfigured ? `${RESEND_API_KEY.substring(0, 6)}...` : 'not_configured',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db-status', async (_req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  let count: number | null = null;
  let activeTable = 'CLUB_REGISTRATIONS';
  let activeColumns = ['ID', 'created_at', 'NAME', 'EMAIL', 'PHONE', 'SHIRT_SIZE'];
  if (configured) {
    count = await getSupabaseCount();
    const schema = await detectTableSchema();
    activeTable = schema.tableName;
    activeColumns = schema.detectedColumns;
  }
  const cleanUrl = getSupabaseUrl();
  const maskedUrl = cleanUrl.replace(/^(https?:\/\/[a-z0-9_-]{4})[a-z0-9_-]+(\..+)$/i, '$1****$2');
  res.json({
    supabaseConfigured: configured,
    supabaseUrl: configured ? maskedUrl : 'Not configured (check .env)',
    tableName: activeTable,
    columns: activeColumns,
    totalRegistrations: count !== null ? count : getRegistrationCount(),
    maxSlots: MAX_CLUB_SLOTS,
    remainingSlots: Math.max(0, MAX_CLUB_SLOTS - (count !== null ? count : getRegistrationCount())),
    pendingSyncCount: getPendingSupabaseRegistrations().length,
  });
});

// ==========================================
// Supabase Storage "product-images" Integration
// ==========================================
// 1B. Supabase Storage Bucket & Public Stream API
// ==========================================
const SUPABASE_PRODUCT_BUCKET = 'prodct-images';
const FALLBACK_PRODUCT_BUCKET = 'product-images';

/**
 * List files available in the Supabase Storage 'prodct-images' bucket
 */
app.get('/api/supabase/storage/product-images', async (_req: Request, res: Response) => {
  const cleanUrl = getSupabaseUrl();
  const publicBaseUrl = `${cleanUrl}/storage/v1/object/public/${SUPABASE_PRODUCT_BUCKET}`;

  if (!isSupabaseConfigured()) {
    return res.json({
      success: false,
      configured: false,
      bucket: SUPABASE_PRODUCT_BUCKET,
      publicBaseUrl,
      files: [],
      total: 0,
      error: 'Supabase is not configured in .env',
    });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({
      success: false,
      bucket: SUPABASE_PRODUCT_BUCKET,
      publicBaseUrl,
      files: [],
      total: 0,
      error: 'Unable to initialize Supabase client',
    });
  }

  try {
    let activeBucket = SUPABASE_PRODUCT_BUCKET;
    let listResult = await supabase.storage.from(SUPABASE_PRODUCT_BUCKET).list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (listResult.error && (listResult.error as any).statusCode === 404) {
      // Fallback check to 'product-images' if bucket name variant exists
      const fallbackResult = await supabase.storage.from(FALLBACK_PRODUCT_BUCKET).list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (!fallbackResult.error) {
        listResult = fallbackResult;
        activeBucket = FALLBACK_PRODUCT_BUCKET;
      }
    }

    const { data, error } = listResult;

    if (error) {
      console.warn('[Supabase Storage List Warning]:', error.message);
    }

    const activeBaseUrl = `${cleanUrl}/storage/v1/object/public/${activeBucket}`;
    const files = (data || []).map((item) => ({
      name: item.name,
      id: item.id,
      updated_at: item.updated_at,
      created_at: item.created_at,
      size: (item.metadata as any)?.size || null,
      publicUrl: `${activeBaseUrl}/${encodeURIComponent(item.name)}`,
    }));

    // Specific verified CDN mappings for the 4 core garments in bucket prodct-images
    const verifiedCdnMap: Record<string, string> = {
      'CAP.jpeg': `${cleanUrl}/storage/v1/object/public/prodct-images/CAP.jpeg`,
      'upndown-cap-07.jpg': `${cleanUrl}/storage/v1/object/public/prodct-images/CAP.jpeg`,
      'BLUE BAGGY FIT DENIM JEANS.jpeg': `${cleanUrl}/storage/v1/object/public/prodct-images/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg`,
      'upndown-denim-01.jpg': `${cleanUrl}/storage/v1/object/public/prodct-images/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg`,
      'BLACK RED EYE BAGGY FIT T SHIRT.jpeg': `${cleanUrl}/storage/v1/object/public/prodct-images/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg`,
      'upndown-tee-01.jpg': `${cleanUrl}/storage/v1/object/public/prodct-images/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg`,
      'BEIGE HAND T SHIRT.jpeg': `${cleanUrl}/storage/v1/object/public/prodct-images/BEIGE%20HAND%20T%20SHIRT.jpeg`,
      'upndown-tee-02.jpg': `${cleanUrl}/storage/v1/object/public/prodct-images/BEIGE%20HAND%20T%20SHIRT.jpeg`,
    };

    // If bucket has files or local uploads exist, include files with full public CDN URLs
    try {
      const localFiles = fs.readdirSync(uploadsDir).filter((f) => !f.startsWith('.'));
      for (const lf of localFiles) {
        if (!files.some((f) => f.name === lf)) {
          const stat = fs.statSync(path.join(uploadsDir, lf));
          const liveUrl = verifiedCdnMap[lf] || `${activeBaseUrl}/${encodeURIComponent(lf)}`;
          files.push({
            name: lf,
            id: lf,
            updated_at: stat.mtime.toISOString(),
            created_at: stat.birthtime.toISOString(),
            size: stat.size,
            publicUrl: liveUrl,
          });
        }
      }
    } catch {}

    return res.json({
      success: true,
      bucket: activeBucket,
      publicBaseUrl: activeBaseUrl,
      files,
      total: files.length,
      suggestedCandidates: {
        'upndown-cap-07': `${cleanUrl}/storage/v1/object/public/prodct-images/CAP.jpeg`,
        'upndown-denim-01': `${cleanUrl}/storage/v1/object/public/prodct-images/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg`,
        'upndown-tee-01': `${cleanUrl}/storage/v1/object/public/prodct-images/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg`,
        'upndown-tee-02': `${cleanUrl}/storage/v1/object/public/prodct-images/BEIGE%20HAND%20T%20SHIRT.jpeg`,
      },
    });
  } catch (err: any) {
    console.error('[Supabase Storage List Error]:', err);
    return res.status(500).json({
      success: false,
      bucket: SUPABASE_PRODUCT_BUCKET,
      publicBaseUrl,
      files: [],
      total: 0,
      error: err.message || 'Internal server error while listing storage files',
    });
  }
});

// Product Image Upload Endpoint with Supabase Storage Support
app.post('/api/upload-product-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, filename, productId } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    const mimeSubtype = matches ? matches[1].toLowerCase() : 'png';
    const ext = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
    const base64Data = matches ? matches[2] : imageBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = matches ? `image/${matches[1]}` : 'image/png';

    // Build safe filename: prioritize productId if provided, otherwise preserve clean original name or timestamp
    let safeName: string;
    if (productId && typeof productId === 'string' && productId.trim()) {
      const cleanPid = productId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      safeName = `${cleanPid}.${ext}`;
    } else if (filename && typeof filename === 'string' && filename.trim()) {
      const cleanBase = filename.trim().replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      safeName = `${cleanBase}_${Date.now()}.${ext}`;
    } else {
      safeName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    }

    // Always keep a local file mirror in /public/uploads for redundancy
    const localFilePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(localFilePath, buffer);
    const localPublicUrl = `/uploads/${safeName}`;

    // Attempt direct upload to Supabase Storage 'product-images' bucket
    const cleanUrl = getSupabaseUrl();
    const publicBaseUrl = `${cleanUrl}/storage/v1/object/public/${SUPABASE_PRODUCT_BUCKET}`;
    const supabasePublicUrl = `${publicBaseUrl}/${safeName}`;

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_PRODUCT_BUCKET)
          .upload(safeName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          console.log(`[Supabase Storage Uploaded]: ${supabasePublicUrl}`);
          return res.json({
            success: true,
            url: supabasePublicUrl,
            filename: safeName,
            storage: 'supabase',
            bucket: SUPABASE_PRODUCT_BUCKET,
          });
        }

        console.warn(`[Supabase Storage Upload Warning]: ${uploadError.message}. Using local backup.`);
        return res.json({
          success: true,
          url: localPublicUrl,
          supabaseCandidateUrl: supabasePublicUrl,
          filename: safeName,
          storage: 'local_fallback',
          bucket: SUPABASE_PRODUCT_BUCKET,
          notice: `Saved to server uploads. Supabase bucket upload notice: ${uploadError.message}`,
        });
      } catch (storageErr: any) {
        console.warn(`[Supabase Storage Exception]: ${storageErr.message}. Using local backup.`);
        return res.json({
          success: true,
          url: localPublicUrl,
          supabaseCandidateUrl: supabasePublicUrl,
          filename: safeName,
          storage: 'local_fallback',
          bucket: SUPABASE_PRODUCT_BUCKET,
          notice: `Saved to server uploads. Storage note: ${storageErr.message}`,
        });
      }
    }

    // Supabase not configured: return local public URL
    console.log(`[Local Product Image Uploaded]: ${localPublicUrl}`);
    return res.json({
      success: true,
      url: localPublicUrl,
      filename: safeName,
      storage: 'local',
    });
  } catch (err: any) {
    console.error('[Product Image Upload Failed]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Image upload failed' });
  }
});

// Product Image Upload from Remote URL directly into Supabase Storage
app.post('/api/upload-from-url', async (req: Request, res: Response) => {
  try {
    const { imageUrl, filename, productId } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'No image URL provided' });
    }

    const trimmedUrl = imageUrl.trim();
    const cleanUrl = getSupabaseUrl();

    // If it is already a direct Supabase Storage object in our bucket, return it directly
    if (
      trimmedUrl.includes(`/storage/v1/object/public/${SUPABASE_PRODUCT_BUCKET}/`) ||
      trimmedUrl.includes(`/storage/v1/object/public/${FALLBACK_PRODUCT_BUCKET}/`)
    ) {
      return res.json({
        success: true,
        url: trimmedUrl,
        filename: decodeURIComponent(trimmedUrl.split('/').pop()?.split('?')[0] || 'product-image.jpg'),
        storage: 'supabase',
        bucket: SUPABASE_PRODUCT_BUCKET,
        notice: 'Already hosted in Supabase Storage bucket.',
      });
    }

    // Fetch the remote image
    const response = await fetch(trimmedUrl);
    if (!response.ok) {
      return res.status(400).json({
        success: false,
        error: `Could not fetch remote image (Status ${response.status}: ${response.statusText})`,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
      ? 'webp'
      : contentType.includes('svg')
      ? 'svg'
      : 'jpg';

    let safeName: string;
    if (productId && typeof productId === 'string' && productId.trim()) {
      const cleanPid = productId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      safeName = `${cleanPid}.${ext}`;
    } else if (filename && typeof filename === 'string' && filename.trim()) {
      const cleanBase = filename.trim().replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      safeName = `${cleanBase}_${Date.now()}.${ext}`;
    } else {
      const urlBase = trimmedUrl.split('/').pop()?.split('?')[0]?.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      safeName = `${urlBase || 'product'}_${Date.now()}.${ext}`;
    }

    // Write to local uploads mirror
    const localFilePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(localFilePath, buffer);
    const localPublicUrl = `/uploads/${safeName}`;

    // Upload to Supabase Storage
    const publicBaseUrl = `${cleanUrl}/storage/v1/object/public/${SUPABASE_PRODUCT_BUCKET}`;
    const supabasePublicUrl = `${publicBaseUrl}/${safeName}`;

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_PRODUCT_BUCKET)
          .upload(safeName, buffer, {
            contentType,
            upsert: true,
          });

        if (!uploadError) {
          console.log(`[Supabase Storage URL Uploaded]: ${supabasePublicUrl}`);
          return res.json({
            success: true,
            url: supabasePublicUrl,
            filename: safeName,
            storage: 'supabase',
            bucket: SUPABASE_PRODUCT_BUCKET,
          });
        }

        console.warn(`[Supabase Storage URL Upload Warning]: ${uploadError.message}. Using local backup.`);
        return res.json({
          success: true,
          url: localPublicUrl,
          supabaseCandidateUrl: supabasePublicUrl,
          filename: safeName,
          storage: 'local_fallback',
          bucket: SUPABASE_PRODUCT_BUCKET,
          notice: `Saved to server uploads. Supabase bucket upload notice: ${uploadError.message}`,
        });
      } catch (storageErr: any) {
        console.warn(`[Supabase Storage Exception on URL Upload]: ${storageErr.message}`);
      }
    }

    return res.json({
      success: true,
      url: localPublicUrl,
      filename: safeName,
      storage: 'local',
      bucket: SUPABASE_PRODUCT_BUCKET,
    });
  } catch (err: any) {
    console.error('[Upload From URL Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to upload from URL' });
  }
});

// ==========================================
// Product Sellout Velocity Voting API
// ==========================================
const votesFilePath = path.join(process.cwd(), 'data_product_votes.json');
let inMemoryVotes: Record<string, number> = {
  'upndown-denim-01': 512,
  'upndown-tee-01': 468,
  'upndown-cap-07': 384,
  'upndown-tee-02': 295,
};

if (fs.existsSync(votesFilePath)) {
  try {
    const rawVotes = fs.readFileSync(votesFilePath, 'utf-8');
    inMemoryVotes = { ...inMemoryVotes, ...JSON.parse(rawVotes) };
  } catch (e) {
    console.warn('[Votes Disk Read]: Default votes restored');
  }
}

function persistVotesToDisk(): void {
  try {
    fs.writeFileSync(votesFilePath, JSON.stringify(inMemoryVotes, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Votes Disk Write Failed]:', e);
  }
}

app.get('/api/product-votes', (_req: Request, res: Response) => {
  const total = Object.values(inMemoryVotes).reduce((sum, v) => sum + (Number(v) || 0), 0);
  res.json({
    success: true,
    votes: inMemoryVotes,
    totalVotes: total,
  });
});

app.post('/api/product-votes', (req: Request, res: Response) => {
  const { productId, previousProductId } = req.body;
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ success: false, error: 'Product ID is required' });
  }

  // Decrement previous vote if user is switching their choice
  if (previousProductId && previousProductId !== productId && (inMemoryVotes[previousProductId] || 0) > 0) {
    inMemoryVotes[previousProductId] = Math.max(0, (inMemoryVotes[previousProductId] || 1) - 1);
  }

  inMemoryVotes[productId] = (inMemoryVotes[productId] || 0) + 1;
  persistVotesToDisk();

  const total = Object.values(inMemoryVotes).reduce((sum, v) => sum + (Number(v) || 0), 0);
  return res.json({
    success: true,
    votes: inMemoryVotes,
    totalVotes: total,
    votedProductId: productId,
  });
});

app.post('/api/product-votes/reset', (_req: Request, res: Response) => {
  inMemoryVotes = {
    'upndown-denim-01': 512,
    'upndown-tee-01': 468,
    'upndown-cap-07': 384,
    'upndown-tee-02': 295,
  };
  persistVotesToDisk();
  const total = Object.values(inMemoryVotes).reduce((sum, v) => sum + (Number(v) || 0), 0);
  return res.json({
    success: true,
    votes: inMemoryVotes,
    totalVotes: total,
  });
});

// ==========================================
// 2. Club Member Registration & Email API
// ==========================================
app.post('/api/send-club-registration', async (req: Request, res: Response) => {
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
  } = req.body;

  // 1. Backend validation of required fields: trim and lowercase email
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

  let member: any = null;
  let totalCount = 0;
  let remainingSlots = 0;

  // 2. Process with Supabase database if configured, or atomic local ledger
  if (isSupabaseConfigured()) {
    console.log(`[Supabase Integration] Registering member for email: ${normalizedEmail}`);
    const effectiveTShirt = (tshirtSize || req.body.tshirt_size || shirt_size || sizePreference || 'M (Oversized)').trim();
    const effectivePant = (pantSize || req.body.pant_size || req.body.denim_jeans_size || '32 (Wide)').trim();
    const effectiveCap = (capSize || req.body.cap_size || 'One Size (Adjustable)').trim();

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
        console.warn(`[Supabase Duplicate Blocked]: ${sbResult.error}`);
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_EMAIL',
          error: 'This email is already registered.',
          totalRegistrations: sbResult.totalCount,
          maxSlots: MAX_CLUB_SLOTS,
        });
      }

      if (sbResult.code === 'CAPACITY_REACHED') {
        console.warn(`[Supabase Capacity Reached]: ${sbResult.error}`);
        return res.status(400).json({
          success: false,
          code: 'CAPACITY_REACHED',
          error: sbResult.error || 'THE CLUB allocation is fully booked. All 100 member slots for Drop 01 have been claimed.',
          totalRegistrations: sbResult.totalCount,
          maxSlots: MAX_CLUB_SLOTS,
        });
      }

      if (sbResult.code === 'RLS_RESTRICTION') {
        console.warn(`[Supabase Insert Blocked by RLS]: ${sbResult.error}`);
        // CRITICAL (Requirement 15): Do not display success or send emails unless database insert actually succeeds!
        return res.status(403).json({
          success: false,
          code: 'RLS_RESTRICTION',
          error: 'Database insert was blocked by Supabase Row Level Security (RLS). Please execute the INSERT policy in your Supabase SQL Editor (see supabase-schema.sql) so registrations can be saved.',
          totalRegistrations: sbResult.totalCount,
          maxSlots: MAX_CLUB_SLOTS,
        });
      }

      return res.status(400).json({
        success: false,
        code: sbResult.code,
        error: sbResult.error || 'Database registration failed. Please retry.',
        totalRegistrations: sbResult.totalCount,
        maxSlots: MAX_CLUB_SLOTS,
      });
    } else {
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
        tshirtSize: typeof tshirtSize === 'string' ? tshirtSize : undefined,
        pantSize: typeof pantSize === 'string' ? pantSize : undefined,
        capSize: typeof capSize === 'string' ? capSize : undefined,
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

      // Mirror in local memory ledger for fast querying
      addRegistration(member);
    }
  } else {
    // Atomic local ledger fallback
    const registrationResult = registerClubMemberAtomically({
      name: cleanName,
      rawEmail,
      phone: cleanPhone,
      passCode,
      positionNumber: Number(positionNumber) || undefined,
      sizePreference: effectiveShirtSize,
      tshirtSize: typeof tshirtSize === 'string' ? tshirtSize : undefined,
      pantSize: typeof pantSize === 'string' ? pantSize : undefined,
      capSize: typeof capSize === 'string' ? capSize : undefined,
      categories,
      launchDate,
      cryptoSignature,
      notes,
      source: 'web_registration',
    });

    if (!registrationResult.success || !registrationResult.member) {
      const status = registrationResult.code === 'DUPLICATE_EMAIL' ? 409 : 400;
      console.warn(`[Club Registration Rejected] ${registrationResult.code}: ${registrationResult.error}`);
      // CRITICAL: Do NOT send confirmation emails for duplicate or failed registrations!
      return res.status(status).json({
        success: false,
        code: registrationResult.code,
        error: registrationResult.error || 'This email is already registered.',
        totalRegistrations: registrationResult.totalCount,
        remainingSlots: registrationResult.remainingSlots,
        maxSlots: MAX_CLUB_SLOTS,
      });
    }

    member = registrationResult.member;
    totalCount = registrationResult.totalCount;
    remainingSlots = registrationResult.remainingSlots;
  }

  // 3. Member registration is verified unique and inserted into database.
  // Generate and send confirmation emails
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

  const customerSender = getSenderString('UP N DOWN Atelier', RESEND_FROM_EMAIL);
  const ownerSender = getSenderString('UP N DOWN Storefront', RESEND_FROM_EMAIL);

  let customerDelivery = {
    to: member.email,
    status: 'pending',
    id: `local_${Date.now()}_cust`,
    error: null as string | null,
  };

  let ownerDelivery = {
    to: OWNER_NOTIFICATION_EMAIL,
    status: 'pending',
    id: `local_${Date.now()}_own`,
    error: null as string | null,
  };

  // 4. Dispatch Live Emails via Resend if API key is active
  if (resend) {
    try {
      let custResult = await resend.emails.send({
        from: customerSender,
        to: member.email,
        subject: customerEmail.subject,
        html: customerEmail.html,
        text: customerEmail.text,
      });

      if (custResult.error) {
        customerDelivery.status = 'error';
        customerDelivery.error = custResult.error.message;
        console.error('[Resend Error - Customer Delivery]:', custResult.error.message || custResult.error);
      } else {
        customerDelivery.status = 'delivered';
        customerDelivery.id = custResult.data?.id || customerDelivery.id;
        console.log(`[Resend] Customer confirmation delivered to ${member.email} (ID: ${customerDelivery.id})`);
      }
    } catch (err: any) {
      customerDelivery.status = 'error';
      customerDelivery.error = err.message || 'Failed to dispatch customer email';
      console.error('[Resend Exception - Customer Email]:', err.message || err);
    }

    try {
      const ownResult = await resend.emails.send({
        from: ownerSender,
        to: OWNER_NOTIFICATION_EMAIL,
        subject: ownerEmail.subject,
        html: ownerEmail.html,
        text: ownerEmail.text,
      });

      if (ownResult.error) {
        ownerDelivery.status = 'error';
        ownerDelivery.error = ownResult.error.message;
        console.error('[Resend Error - Owner Alert]:', ownResult.error.message || ownResult.error);
      } else {
        ownerDelivery.status = 'delivered';
        ownerDelivery.id = ownResult.data?.id || ownerDelivery.id;
        console.log(`[Resend] Owner notification delivered to ${OWNER_NOTIFICATION_EMAIL} (ID: ${ownerDelivery.id})`);
      }
    } catch (err: any) {
      ownerDelivery.status = 'error';
      ownerDelivery.error = err.message || 'Failed to dispatch owner notification';
      console.error('[Resend Exception - Owner Alert]:', err.message || err);
    }

    return res.json({
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

  // Fallback when RESEND_API_KEY is not set
  customerDelivery.status = 'simulated';
  ownerDelivery.status = 'simulated';

  return res.json({
    success: true,
    mode: 'simulated_no_api_key',
    message: 'Registration confirmed in database. Add RESEND_API_KEY in .env for live email delivery.',
    registration: member,
    totalRegistrations: totalCount,
    remainingSlots,
    maxSlots: MAX_CLUB_SLOTS,
    customerDelivery,
    ownerDelivery,
    dispatchedAt: member.registeredAt,
  });
});

// ==========================================
// 2B. Registration Ledger & Capacity Queries
// ==========================================
app.get('/api/club-registrations/stats', async (_req: Request, res: Response) => {
  let total = getRegistrationCount();
  if (isSupabaseConfigured()) {
    const sbCount = await getSupabaseCount();
    if (sbCount !== null) {
      total = sbCount;
    }
  }
  res.json({
    total,
    remaining: Math.max(0, MAX_CLUB_SLOTS - total),
    maxSlots: MAX_CLUB_SLOTS,
    supabaseConnected: isSupabaseConfigured(),
  });
});

app.get('/api/club-registrations/check', async (req: Request, res: Response) => {
  const rawEmail = typeof req.query.email === 'string' ? req.query.email : '';
  const normalized = normalizeEmail(rawEmail);
  let isRegistered = isEmailRegistered(normalized);

  if (!isRegistered && isSupabaseConfigured()) {
    isRegistered = await isEmailRegisteredInSupabase(normalized);
  }

  res.json({
    email: normalized,
    isRegistered,
    message: isRegistered ? 'This email is already registered.' : 'Available',
    remainingSlots: Math.max(0, MAX_CLUB_SLOTS - getRegistrationCount()),
  });
});

app.get('/api/club-registrations', async (_req: Request, res: Response) => {
  let list = getAllRegistrations();
  if (isSupabaseConfigured()) {
    const sbList = await getAllFromSupabase();
    if (sbList && Array.isArray(sbList)) {
      list = sbList.map((row: any, idx: number) => {
        const email = row.EMAIL || row.email || '';
        const name = row.NAME || row.name || undefined;
        const phone = row.PHONE || row.phone || undefined;
        const tShirtSize = row.T_SHIRT_SIZE || row.t_shirt_size || row.SHIRT_SIZE || row.shirt_size || 'M (Oversized)';
        const capSize = row.CAP_SIZE || row.cap_size || undefined;
        const pantSize = row.DENIM_JEANS_SIZE || row.denim_jeans_size || row.PANT_SIZE || row.pant_size || undefined;

        // Build composite label for display if multiple sizes are specified
        let sizeDisplay = tShirtSize;
        if (pantSize || capSize) {
          const parts: string[] = [];
          if (tShirtSize) parts.push(`Tee: ${tShirtSize.split(' ')[0]}`);
          if (pantSize) parts.push(`Jeans: ${pantSize.split(' ')[0]}`);
          if (capSize) parts.push(`Cap: ${capSize.includes('One Size') ? 'OS' : capSize.split(' ')[0]}`);
          sizeDisplay = parts.join(' · ');
        }

        const createdAt = row.created_at || row.CREATED_AT || new Date().toISOString();
        const id = row.id ?? row.ID ?? `sb_${idx}`;

        return {
          id: String(id),
          name,
          email,
          rawEmail: email,
          phone,
          passCode: `UND-2026-SLOT${(idx + 1).toString().padStart(2, '0')}`,
          positionNumber: idx + 1,
          sizePreference: sizeDisplay,
          tshirtSize: tShirtSize,
          pantSize,
          capSize,
          categories: ['Heavy Tees'],
          launchDate: '31st Dec 2026',
          cryptoSignature: 'SUPABASE_ROW_VERIFIED',
          registeredAt: createdAt,
          createdAt,
          source: 'web_registration',
        };
      });
    }
  }
  res.json({
    success: true,
    total: list.length,
    maxSlots: MAX_CLUB_SLOTS,
    registrations: list,
    supabaseConnected: isSupabaseConfigured(),
  });
});

app.delete('/api/club-registrations/:idOrEmail', async (req: Request, res: Response) => {
  const target = req.params.idOrEmail;
  if (isSupabaseConfigured()) {
    await deleteFromSupabase(target);
  }
  const deleted = deleteRegistration(target);
  let total = getRegistrationCount();
  if (isSupabaseConfigured()) {
    const sbCount = await getSupabaseCount();
    if (sbCount !== null) total = sbCount;
  }
  res.json({
    success: true,
    deleted,
    target,
    totalRemaining: total,
    remainingSlots: Math.max(0, MAX_CLUB_SLOTS - total),
  });
});

app.post('/api/club-registrations/clear', async (_req: Request, res: Response) => {
  if (isSupabaseConfigured()) {
    await clearAllFromSupabase();
  }
  clearAllRegistrations();
  res.json({
    success: true,
    message: 'All club members deleted and registration ledger cleared.',
    total: 0,
    remainingSlots: MAX_CLUB_SLOTS,
  });
});

app.post('/api/club-registrations/reset', async (_req: Request, res: Response) => {
  if (isSupabaseConfigured()) {
    await clearAllFromSupabase();
  }
  clearAllRegistrations();
  res.json({
    success: true,
    message: 'All club members deleted and registration ledger reset to 0.',
    total: 0,
    remainingSlots: MAX_CLUB_SLOTS,
  });
});

app.post('/api/supabase/sync-pending', async (_req: Request, res: Response) => {
  const pending = getPendingSupabaseRegistrations();
  if (pending.length === 0) {
    return res.json({
      success: true,
      syncedCount: 0,
      message: 'All registrations are already synchronized with Supabase.',
    });
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const reg of pending) {
    const result = await registerToSupabase({
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      tshirt_size: reg.tshirtSize || reg.sizePreference,
      pant_size: reg.pantSize,
      cap_size: reg.capSize,
      shirt_size: reg.sizePreference,
    });

    if (result.success) {
      markRegistrationSynced(reg.email, result.record?.id);
      syncedCount++;
    } else {
      errors.push(`${reg.email}: ${result.error || result.code}`);
    }
  }

  res.json({
    success: syncedCount > 0,
    syncedCount,
    remainingPending: pending.length - syncedCount,
    errors: errors.slice(0, 5),
  });
});

app.get('/api/supabase/test-connection', async (_req: Request, res: Response) => {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return res.json({
      success: false,
      error: 'Supabase is not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY.',
    });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ success: false, error: 'Could not create Supabase client' });
  }

  const schema = await detectTableSchema(true);
  const { count, error } = await supabase
    .from(schema.tableName)
    .select('*', { count: 'exact', head: true });

  res.json({
    success: !error,
    tableName: schema.tableName,
    columns: schema.detectedColumns,
    count,
    error: error?.message || null,
    errorCode: error?.code || null,
  });
});

// ==========================================
// 3. Isolated Test Endpoint: Customer Confirmation
// ==========================================
app.post('/api/test-email/customer', async (req: Request, res: Response) => {
  const targetEmail = req.body.email?.trim() || OWNER_NOTIFICATION_EMAIL;

  const testPayload = generateCustomerConfirmationEmail({
    name: req.body.name || 'Test Client',
    email: targetEmail,
    phone: '+1 (555) 019-2831',
    passCode: 'UND-2026-TEST99',
    positionNumber: 99,
    sizePreference: 'L (Baggy Fit)',
    categories: ['Heavy Tees', 'Denim Loose Pant'],
    launchDate: '31st Dec 2026',
    cryptoSignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  });

  if (!resend) {
    return res.json({
      success: false,
      mode: 'simulated',
      message: 'RESEND_API_KEY is not configured in .env. Cannot dispatch live test email.',
      previewSubject: testPayload.subject,
      targetEmail,
    });
  }

  try {
    const custSender = getSenderString('UP N DOWN Atelier', RESEND_FROM_EMAIL);
    const result = await resend.emails.send({
      from: custSender,
      to: targetEmail,
      subject: testPayload.subject,
      html: testPayload.html,
      text: testPayload.text,
    });

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error.message });
    }

    return res.json({
      success: true,
      mode: 'live_resend',
      messageId: result.data?.id,
      recipient: targetEmail,
      subject: testPayload.subject,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Isolated Test Endpoint: Owner Notification
// ==========================================
app.post('/api/test-email/owner', async (req: Request, res: Response) => {
  const targetEmail = req.body.recipient ? normalizeEmail(req.body.recipient) : OWNER_NOTIFICATION_EMAIL;

  const testPayload = generateOwnerNotificationEmail({
    name: 'Sample High-Priority Customer',
    email: 'client.vip@sample-atelier.com',
    phone: '+91 98765 43210',
    passCode: 'UND-2026-OWNERTEST',
    positionNumber: 77,
    sizePreference: 'M (Oversized)',
    categories: ['Baseball Cap', 'Heavy Tees'],
    launchDate: '31st Dec 2026',
    cryptoSignature: '4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3',
    registeredAt: new Date().toISOString(),
    notes: 'Test submission from admin verification console',
  });

  if (!resend) {
    return res.json({
      success: false,
      mode: 'simulated',
      message: 'RESEND_API_KEY is not configured in .env. Cannot dispatch live test email.',
      previewSubject: testPayload.subject,
      targetEmail,
    });
  }

  try {
    const ownSender = getSenderString('UP N DOWN Storefront', RESEND_FROM_EMAIL);
    const result = await resend.emails.send({
      from: ownSender,
      to: targetEmail,
      subject: testPayload.subject,
      html: testPayload.html,
      text: testPayload.text,
    });

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error.message });
    }

    return res.json({
      success: true,
      mode: 'live_resend',
      messageId: result.data?.id,
      recipient: targetEmail,
      subject: testPayload.subject,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. Frontend Delivery (Vite Dev / Static Prod)
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UP N DOWN Fullstack Server running on http://0.0.0.0:${PORT}`);
    console.log(`Resend Mail Gateway: ${RESEND_API_KEY ? 'Configured' : 'Standby (Simulated Mode - Add RESEND_API_KEY in .env)'}`);
    console.log(`Owner Target Email: ${OWNER_NOTIFICATION_EMAIL}`);
  });
}

// Only start standalone HTTP listener when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  });
}

export default app;
export { app };

