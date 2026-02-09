-- Initialize the database with a comprehensive authentication and auditing schema

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create dependencies for SSO features first (referenced by other tables)
CREATE TABLE IF NOT EXISTS auth.sso_providers (
    id uuid NOT NULL PRIMARY KEY,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS auth.sso_domains (
    id uuid NOT NULL PRIMARY KEY,
    sso_provider_id uuid REFERENCES auth.sso_providers(id),
    domain text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- auth.audit_log_entries
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL PRIMARY KEY,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(255)
);

-- auth.instances
CREATE TABLE IF NOT EXISTS auth.instances (
    id uuid NOT NULL PRIMARY KEY,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- auth.schema_migrations
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version character varying(255) NOT NULL PRIMARY KEY
);

-- auth.oauth_clients
CREATE TABLE IF NOT EXISTS auth.oauth_clients (
    id uuid NOT NULL PRIMARY KEY,
    client_secret_hash text,
    registration_type text,
    redirect_uris text,
    grant_types text,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,
    client_type text,
    token_endpoint_auth_method text
);

-- auth.oauth_client_states
CREATE TABLE IF NOT EXISTS auth.oauth_client_states (
    id uuid NOT NULL PRIMARY KEY,
    provider_type text,
    code_verifier text,
    created_at timestamp with time zone
);

-- auth.saml_providers
CREATE TABLE IF NOT EXISTS auth.saml_providers (
    id uuid NOT NULL PRIMARY KEY,
    sso_provider_id uuid REFERENCES auth.sso_providers(id),
    entity_id text UNIQUE,
    metadata_xml text,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text
);

-- auth.flow_state
CREATE TABLE IF NOT EXISTS auth.flow_state (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid,
    auth_code text,
    code_challenge_method text,
    code_challenge text,
    provider_type text,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false
);

-- auth.identities
-- Note: auth.users is assumed to exist as the core table of the auth schema
CREATE TABLE IF NOT EXISTS auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    identity_data jsonb,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text,
    id uuid NOT NULL PRIMARY KEY
);

-- auth.mfa_factors
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    friendly_name text,
    factor_type text,
    status text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone UNIQUE,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);

-- auth.sessions
CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal text,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);

-- auth.mfa_amr_claims
CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
    session_id uuid NOT NULL REFERENCES auth.sessions(id),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text,
    id uuid NOT NULL PRIMARY KEY
);

-- auth.mfa_challenges
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
    id uuid NOT NULL PRIMARY KEY,
    factor_id uuid REFERENCES auth.mfa_factors(id),
    created_at timestamp with time zone,
    verified_at timestamp with time zone,
    ip_address inet,
    otp_code text,
    web_authn_session_data jsonb
);

-- auth.refresh_tokens
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL PRIMARY KEY,
    token character varying(255) UNIQUE,
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid REFERENCES auth.sessions(id)
);

-- auth.oauth_authorizations
CREATE TABLE IF NOT EXISTS auth.oauth_authorizations (
    id uuid NOT NULL PRIMARY KEY,
    authorization_id text UNIQUE,
    client_id uuid REFERENCES auth.oauth_clients(id),
    user_id uuid REFERENCES auth.users(id),
    redirect_uri text,
    scope text,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method text,
    response_type text,
    status text,
    authorization_code text UNIQUE,
    created_at timestamp with time zone,
    expires_at timestamp with time zone,
    approved_at timestamp with time zone,
    nonce text
);

-- auth.oauth_consents
CREATE TABLE IF NOT EXISTS auth.oauth_consents (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    client_id uuid REFERENCES auth.oauth_clients(id),
    scopes text,
    granted_at timestamp with time zone,
    revoked_at timestamp with time zone
);

-- auth.one_time_tokens
CREATE TABLE IF NOT EXISTS auth.one_time_tokens (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    token_type text,
    token_hash text,
    relates_to text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);

-- auth.saml_relay_states
CREATE TABLE IF NOT EXISTS auth.saml_relay_states (
    id uuid NOT NULL PRIMARY KEY,
    sso_provider_id uuid REFERENCES auth.sso_providers(id),
    request_id text,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid REFERENCES auth.flow_state(id)
);
