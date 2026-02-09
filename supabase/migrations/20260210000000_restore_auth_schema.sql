-- Restore permissions and clean up auth schema related issues
-- Fixes "Database error querying schema" (HTTP 500) caused by manual modifications or permission issues.

-- 1. Restore permissions for auth schema
-- Grant usage to necessary roles
GRANT USAGE ON SCHEMA auth TO postgres, service_role, anon, authenticated;

-- Grant access to auth tables for service operations (dashboard and service role)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT SELECT ON TABLE auth.users TO postgres, service_role;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;

-- Grant execute on functions (if any custom or system functions need to be accessed)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- 2. Clean up any shadowing tables in public schema
-- These tables (users, sessions, etc.) belong in the 'auth' schema. 
-- If they exist in 'public', they are likely remnants of a bad migration/import and confuse the schema resolution.
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.refresh_tokens CASCADE;
DROP TABLE IF EXISTS public.identities CASCADE;
DROP TABLE IF EXISTS public.instances CASCADE;
DROP TABLE IF EXISTS public.sso_providers CASCADE;
DROP TABLE IF EXISTS public.sso_domains CASCADE;
DROP TABLE IF EXISTS public.saml_providers CASCADE;
DROP TABLE IF EXISTS public.saml_relay_states CASCADE;
DROP TABLE IF EXISTS public.mfa_amr_claims CASCADE;
DROP TABLE IF EXISTS public.mfa_challenges CASCADE;
DROP TABLE IF EXISTS public.mfa_factors CASCADE;
DROP TABLE IF EXISTS public.audit_log_entries CASCADE;
DROP TABLE IF EXISTS public.flow_state CASCADE;

-- 3. Restore Foreign Key Integrity for profiles (public.profiles -> auth.users)
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Check if FK constraint is missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
        ) THEN
            ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_id_fkey
            FOREIGN KEY (id)
            REFERENCES auth.users(id)
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. Restore Foreign Key Integrity for contacts (public.contacts -> public.profiles)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'contacts_user_id_fkey' AND table_name = 'contacts'
        ) THEN
            ALTER TABLE public.contacts
            ADD CONSTRAINT contacts_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES public.profiles(id);
        END IF;
    END IF;
END $$;

-- 5. Restore Foreign Key Integrity for campaigns (public.campaigns -> public.profiles)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'campaigns_user_id_fkey' AND table_name = 'campaigns'
        ) THEN
            ALTER TABLE public.campaigns
            ADD CONSTRAINT campaigns_user_id_fkey
            FOREIGN KEY (user_id)
            REFERENCES public.profiles(id);
        END IF;
    END IF;
END $$;

-- 6. Ensure standard triggers on auth.users are correct and present
-- Drop existing triggers to ensure clean state, then recreate using the functions defined in previous migrations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_new_users();
