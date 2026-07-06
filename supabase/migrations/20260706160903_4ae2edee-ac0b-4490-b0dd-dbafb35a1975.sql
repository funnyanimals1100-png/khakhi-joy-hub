GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_premium(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO anon, authenticated;