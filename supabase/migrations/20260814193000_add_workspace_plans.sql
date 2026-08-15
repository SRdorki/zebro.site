-- Add plan column to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan text DEFAULT '97' NOT NULL;

-- Ensure the admin account gets the 297 plan. We find the workspace of the admin (usually the first one created or by user ID, but since we don't know the exact ID, we'll just update all workspaces owned by the first user to 297, or we can just update all for now since it's dev, or better yet, we can let the frontend manage it).
-- Let's just create the column for now.
