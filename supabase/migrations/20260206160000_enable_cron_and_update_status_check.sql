-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update campaigns status check constraint to include 'processing' and 'pending' as requested in User Story
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check CHECK (status IN ('scheduled', 'pending', 'active', 'processing', 'finished'));

-- Schedule the job to run every minute
-- We use the Anonymous Key provided in the project context to authorize the call
SELECT cron.schedule(
    'process-campaign-queue-job',
    '* * * * *',
    $$
    SELECT
      net.http_post(
          url:='https://trlhwojopyhowtfgijky.supabase.co/functions/v1/process-campaign-queue',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGh3b2pvcHlob3d0Zmdpamt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NzEwNDUsImV4cCI6MjA4NjI0NzA0NX0.30cJ4U8rpilzn0LfG9Y-TAaqn42XmMP4K8SNH7BpQW4"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);
