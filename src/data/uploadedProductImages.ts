/**
 * EXACT USER UPLOADED PRODUCT IMAGES
 * Direct Supabase Storage CDN URLs from bucket 'prodct-images'
 * Base URL: https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/
 */

export const SUPABASE_PRODUCT_IMAGE_URLS = {
  cap: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/CAP.jpeg',
  denim: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg',
  tee01: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg',
  tee02: 'https://uwoyznudoiwjttoxnptr.supabase.co/storage/v1/object/public/prodct-images/BEIGE%20HAND%20T%20SHIRT.jpeg',
};

export const USER_UPLOADED_PRODUCT_IMAGES: Record<string, string> = {
  // Cap: upndown-cap-07.jpg -> CAP.jpeg
  'upndown-cap-07': SUPABASE_PRODUCT_IMAGE_URLS.cap,
  'upndown-cap-07.jpg': SUPABASE_PRODUCT_IMAGE_URLS.cap,
  'CAP.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.cap,
  'CAP': SUPABASE_PRODUCT_IMAGE_URLS.cap,

  // Denim: upndown-denim-01.jpg -> BLUE BAGGY FIT DENIM JEANS.jpeg
  'upndown-denim-01': SUPABASE_PRODUCT_IMAGE_URLS.denim,
  'upndown-denim-01.jpg': SUPABASE_PRODUCT_IMAGE_URLS.denim,
  'BLUE BAGGY FIT DENIM JEANS.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.denim,
  'BLUE%20BAGGY%20FIT%20DENIM%20JEANS.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.denim,
  'BLUE BAGGY FIT DENIM JEANS': SUPABASE_PRODUCT_IMAGE_URLS.denim,

  // Celestial Eye Heavy Tee: upndown-tee-01.jpg -> BLACK RED EYE BAGGY FIT T SHIRT.jpeg
  'upndown-tee-01': SUPABASE_PRODUCT_IMAGE_URLS.tee01,
  'upndown-tee-01.jpg': SUPABASE_PRODUCT_IMAGE_URLS.tee01,
  'BLACK RED EYE BAGGY FIT T SHIRT.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.tee01,
  'BLACK%20RED%20EYE%20BAGGY%20FIT%20T%20SHIRT.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.tee01,
  'BLACK RED EYE BAGGY FIT T SHIRT': SUPABASE_PRODUCT_IMAGE_URLS.tee01,

  // Invisible Bond Atelier Tee: upndown-tee-02.jpg -> BEIGE HAND T SHIRT.jpeg
  'upndown-tee-02': SUPABASE_PRODUCT_IMAGE_URLS.tee02,
  'upndown-tee-02.jpg': SUPABASE_PRODUCT_IMAGE_URLS.tee02,
  'BEIGE HAND T SHIRT.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.tee02,
  'BEIGE%20HAND%20T%20SHIRT.jpeg': SUPABASE_PRODUCT_IMAGE_URLS.tee02,
  'BEIGE HAND T SHIRT': SUPABASE_PRODUCT_IMAGE_URLS.tee02,
};
