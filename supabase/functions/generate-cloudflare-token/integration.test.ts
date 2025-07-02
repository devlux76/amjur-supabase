// Integration test: Authenticate with Supabase, call the function, print the Cloudflare token
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Values from .env.local file
const SUPABASE_URL = "https://kaglpfxsckjhqveybsdx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZ2xwZnhzY2tqaHF2ZXlic2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzYzMDgsImV4cCI6MjA2NjgxMjMwOH0.TN7YNZKc50unjJqhJksw4jUHNYpT0K21wWkwPeqlwso";
const SUPABASE_TEST_USER = "test@amjur.org";
const SUPABASE_TEST_USER_PASS = "pT0K21wWkwPeqlwso";
const FUNCTION_URL = "https://kaglpfxsckjhqveybsdx.supabase.co/functions/v1/generate-cloudflare-token";

async function main() {
  // 1. Authenticate test user
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: SUPABASE_TEST_USER,
    password: SUPABASE_TEST_USER_PASS,
  });
  if (error || !data.session) {
    console.error("Failed to authenticate test user:", error);
    Deno.exit(1);
  }
  const jwt = data.session.access_token;
  console.log("Authenticated! JWT:", jwt.slice(0, 32) + "...");

  // 2. Call the function with the JWT
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });
  const body = await resp.json();
  console.log("Function response status:", resp.status);
  console.log("Function response body:", body);
  if (body.cloudflareToken) {
    console.log("Returned Cloudflare token:", body.cloudflareToken);
  } else {
    console.error("No Cloudflare token returned.");
  }
}

main();
