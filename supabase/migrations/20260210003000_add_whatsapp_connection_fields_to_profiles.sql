DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_connection_type') THEN
        CREATE TYPE public.whatsapp_connection_type AS ENUM ('webhook', 'evolution');
    END IF;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_connection_type public.whatsapp_connection_type DEFAULT 'webhook',
ADD COLUMN IF NOT EXISTS evolution_instance_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'disconnected';
