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
-- Future Tables
-- ============================================================
-- Future tables will be added here as features are implemented
-- (photos, ratings, favorites, etc.)
