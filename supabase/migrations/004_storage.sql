-- ==============================================================================
-- 004_storage.sql
-- Supabase Storage Buckets & Policies for E-OSIS SKWADA
-- ==============================================================================

-- 1. Insert Storage Buckets (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('school-assets', 'school-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
    ('candidate-images', 'candidate-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'school-assets'
DROP POLICY IF EXISTS "Public can view school assets" ON storage.objects;
CREATE POLICY "Public can view school assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "Admins can upload school assets" ON storage.objects;
CREATE POLICY "Admins can upload school assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "Admins can update school assets" ON storage.objects;
CREATE POLICY "Admins can update school assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'school-assets');

DROP POLICY IF EXISTS "Admins can delete school assets" ON storage.objects;
CREATE POLICY "Admins can delete school assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'school-assets');

-- 3. Storage Policies for 'candidate-images'
DROP POLICY IF EXISTS "Public can view candidate images" ON storage.objects;
CREATE POLICY "Public can view candidate images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'candidate-images');

DROP POLICY IF EXISTS "Admins can upload candidate images" ON storage.objects;
CREATE POLICY "Admins can upload candidate images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'candidate-images');

DROP POLICY IF EXISTS "Admins can update candidate images" ON storage.objects;
CREATE POLICY "Admins can update candidate images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'candidate-images');

DROP POLICY IF EXISTS "Admins can delete candidate images" ON storage.objects;
CREATE POLICY "Admins can delete candidate images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'candidate-images');
