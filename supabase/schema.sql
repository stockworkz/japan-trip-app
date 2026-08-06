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

-- IMPORTANT: Storage bucket and policies must be configured manually in Supabase Dashboard
-- 
-- 1. Create bucket (Storage > New bucket):
--    Name: trip-photos
--    Public: true (for read access)
--    File size limit: 5MB
--    Allowed MIME types: image/*
--
-- 2. Create Storage Policies (Storage > trip-photos > Policies):
--
--    Policy 1: "Public read access"
--    Operation: SELECT
--    Policy definition:
--      bucket_id = 'trip-photos'
--
--    Policy 2: "Authenticated users can upload"  
--    Operation: INSERT
--    Policy definition:
--      bucket_id = 'trip-photos' AND auth.role() = 'authenticated'
--
--    Policy 3: "Users can delete own photos"
--    Operation: DELETE
--    Policy definition:
--      bucket_id = 'trip-photos' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- Upload path format: {userId}/{timestamp}-{random}.{ext}
-- The policy checks that the first folder name equals the user's ID

-- ============================================================
-- Activity Feedback Table (Ratings, Favorites, and Memories)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add memory column (rerunnable)
ALTER TABLE activity_feedback ADD COLUMN IF NOT EXISTS memory TEXT;

-- Add unique constraint on user_id and activity_id (rerunnable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_user_activity'
      AND conrelid = 'activity_feedback'::regclass
  ) THEN
    ALTER TABLE activity_feedback
      ADD CONSTRAINT unique_user_activity
      UNIQUE (user_id, activity_id);
  END IF;
END $$;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_feedback_activity_id 
  ON activity_feedback(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_feedback_user_id 
  ON activity_feedback(user_id);

-- Enable Row Level Security
ALTER TABLE activity_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (makes SQL rerunnable)
DROP POLICY IF EXISTS "Anyone authenticated can read activity feedback" ON activity_feedback;
DROP POLICY IF EXISTS "Users can insert their own activity feedback" ON activity_feedback;
DROP POLICY IF EXISTS "Users can update their own activity feedback" ON activity_feedback;
DROP POLICY IF EXISTS "Users can delete their own activity feedback" ON activity_feedback;

-- RLS Policies for activity feedback

-- Policy: Anyone authenticated can read all feedback
CREATE POLICY "Anyone authenticated can read activity feedback"
  ON activity_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own activity feedback"
  ON activity_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update their own activity feedback"
  ON activity_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete their own activity feedback"
  ON activity_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Activity Locations (Shared Navigation Addresses)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT UNIQUE NOT NULL,
  address TEXT,
  apple_maps_url TEXT,
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_locations_activity_id 
  ON activity_locations(activity_id);

-- Enable Row Level Security
ALTER TABLE activity_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (makes SQL rerunnable)
DROP POLICY IF EXISTS "Anyone authenticated can read activity locations" ON activity_locations;
DROP POLICY IF EXISTS "Authenticated users can insert activity locations" ON activity_locations;
DROP POLICY IF EXISTS "Authenticated users can update activity locations" ON activity_locations;

-- RLS Policies for activity locations

-- Policy: Anyone authenticated can read all shared locations
CREATE POLICY "Anyone authenticated can read activity locations"
  ON activity_locations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert locations
CREATE POLICY "Authenticated users can insert activity locations"
  ON activity_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = updated_by);

-- Policy: Authenticated users can update any location
CREATE POLICY "Authenticated users can update activity locations"
  ON activity_locations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

-- ============================================================
-- Future Tables
-- ============================================================
-- Future tables will be added here as features are implemented


-- DEPRECATED: The following duplicated content should be removed
-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_feedback_activity_id 
  ON activity_feedback(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_feedback_user_id 
  ON activity_feedback(user_id);

-- Enable Row Level Security
ALTER TABLE activity_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (makes SQL rerunnable)
DROP POLICY IF EXISTS "Anyone authenticated can read activity feedback" ON activity_feedback;
DROP POLICY IF EXISTS "Users can insert their own activity feedback" ON activity_feedback;
DROP POLICY IF EXISTS "Users can update their own activity feedback" ON activity_feedback;
DROP POLICY IF EXISTS "Users can delete their own activity feedback" ON activity_feedback;

-- RLS Policies for activity feedback

-- Policy: Anyone authenticated can read all feedback
CREATE POLICY "Anyone authenticated can read activity feedback"
  ON activity_feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own activity feedback"
  ON activity_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update their own activity feedback"
  ON activity_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete their own activity feedback"
  ON activity_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- Future Tables
-- ============================================================
-- Future tables will be added here as features are implemented
