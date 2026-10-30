-- ==============================================================================
-- UP N DOWN — Supabase Database Integration Schema & RLS Policies
-- Table: public."CLUB_REGISTRATIONS"
-- Paste and execute this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uwoyznudoiwjttoxnptr/sql/new
-- ==============================================================================

-- 1. Enforce case-insensitive unique email index on existing "CLUB_REGISTRATIONS"
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_registrations_upper_email_unique
ON "CLUB_REGISTRATIONS" (LOWER(TRIM("EMAIL")));

-- 2. Database function and trigger enforcing 100-registration cap
CREATE OR REPLACE FUNCTION check_100_registration_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM "CLUB_REGISTRATIONS") >= 100 THEN
    RAISE EXCEPTION 'Registration limit reached: Drop 01 is strictly limited to 100 member slots.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_100_registration_limit ON "CLUB_REGISTRATIONS";
CREATE TRIGGER trg_check_100_registration_limit
BEFORE INSERT ON "CLUB_REGISTRATIONS"
FOR EACH ROW
EXECUTE FUNCTION check_100_registration_limit();

-- 3. Row Level Security (RLS) stays ENABLED (security is NOT disabled)
ALTER TABLE "CLUB_REGISTRATIONS" ENABLE ROW LEVEL SECURITY;

-- 4. Secure INSERT Policy: Allow anonymous visitors to register
-- (The 100-member cap is enforced securely above by check_100_registration_limit trigger)
DROP POLICY IF EXISTS "Allow public insert with 100 cap" ON "CLUB_REGISTRATIONS";
DROP POLICY IF EXISTS "Allow public insert" ON "CLUB_REGISTRATIONS";
CREATE POLICY "Allow public insert"
ON "CLUB_REGISTRATIONS"
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

-- 5. Secure SELECT Policy: Allow reading registration count for live slot counter
DROP POLICY IF EXISTS "Allow reading registration count" ON "CLUB_REGISTRATIONS";
DROP POLICY IF EXISTS "Allow public select" ON "CLUB_REGISTRATIONS";
CREATE POLICY "Allow public select"
ON "CLUB_REGISTRATIONS"
FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 6. Service Role Full Administrative Access Policy
DROP POLICY IF EXISTS "Service role full access" ON "CLUB_REGISTRATIONS";
CREATE POLICY "Service role full access"
ON "CLUB_REGISTRATIONS"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 7. Supabase Storage: Public Bucket 'product-images' Configuration & RLS
-- ==============================================================================
-- Create or ensure the public bucket 'product-images' exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public viewing of product images
DROP POLICY IF EXISTS "Allow public read product images" ON storage.objects;
CREATE POLICY "Allow public read product images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

-- Allow public uploads to product images
DROP POLICY IF EXISTS "Allow public upload product images" ON storage.objects;
CREATE POLICY "Allow public upload product images"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'product-images' );

-- Allow public updates to product images
DROP POLICY IF EXISTS "Allow public update product images" ON storage.objects;
CREATE POLICY "Allow public update product images"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'product-images' );

