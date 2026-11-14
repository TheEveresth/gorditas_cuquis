const SUPABASE_URL = "https://fkzargiqommrbagqnemm.supabase.co";
const SUPABASE_KEY = "sb_publishable_uDXPK-ZsE92RyXRy5gs4-A_21gwhK8Q";

if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}

const db = window.supabaseClient;