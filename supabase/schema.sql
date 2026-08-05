-- Japan Trip App - Supabase Schema
-- This file documents the database schema for the Japan Trip 2026 app.

-- Authentication Setup:
-- - Using Supabase Auth with anonymous sign-in
-- - User metadata stores display_name for traveler identification
-- - No custom tables required for basic authentication

-- User Metadata Structure:
-- {
--   display_name: string  // Traveler's chosen display name
-- }

-- ============================================================
-- Activity Completion Table
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_completion (
  activity_id TEXT PRIMARY KEY,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_completion_updated_at 
  ON activity_completion(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_completion ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated anonymous users

-- Policy: Anyone authenticated can read all completion records
CREATE POLICY "Anyone authenticated can read activity completion"
  ON activity_completion
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert completion records
CREATE POLICY "Authenticated users can insert activity completion"
  ON activity_completion
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = updated_by);

-- Policy: Authenticated users can update any completion record
CREATE POLICY "Authenticated users can update activity completion"
  ON activity_completion
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

-- ============================================================
-- Trip Photos Table
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploader_name TEXT NOT NULL,
  caption TEXT,
  day_date DATE NOT NULL,
  activity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trip_photos_day_date 
  ON trip_photos(day_date);
CREATE INDEX IF NOT EXISTS idx_trip_photos_activity_id 
  ON trip_photos(activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trip_photos_created_at 
  ON trip_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_photos_uploader_id 
  ON trip_photos(uploader_id);

-- Enable Row Level Security
ALTER TABLE trip_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip photos

-- Policy: Anyone authenticated can read all trip photos
CREATE POLICY "Anyone authenticated can read trip photos"
  ON trip_photos
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert their own photos
CREATE POLICY "Authenticated users can insert trip photos"
  ON trip_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

-- Policy: Users can only delete their own photos
CREATE POLICY "Users can delete their own trip photos"
  ON trip_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploader_id);

-- ============================================================
-- Storage Bucket for Trip Photos
-- ============================================================

-- Note: Storage bucket creation must be done via Supabase Dashboard or API
-- Bucket name: trip-photos
-- Settings:
--   - Public: true (for read access)
--   - File size limit: 5MB
--   - Allowed MIME types: image/*

-- Storage Policies (apply these in Supabase Dashboard under Storage > Policies):

-- Policy: Public read access to all trip photos
-- SELECT: bucket_id = 'trip-photos'

-- Policy: Authenticated users can upload photos
-- INSERT: bucket_id = 'trip-photos' AND auth.role() = 'authenticated'

-- Policy: Users can only delete their own photos
-- DELETE: bucket_id = 'trip-photos' AND (storage.foldername(name))[1] = auth.uid()::text

-- ============================================================
-- Future Tables
-- ============================================================
-- Future tables will be added here as features are implemented
-- (ratings, favorites, etc.)
