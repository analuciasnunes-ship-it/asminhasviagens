INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-covers', 'trip-covers', true);

CREATE POLICY "Authenticated users can upload trip covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trip-covers');

CREATE POLICY "Public can view trip covers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'trip-covers');

CREATE POLICY "Authenticated users can delete trip covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'trip-covers');