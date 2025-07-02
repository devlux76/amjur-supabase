// deno-lint-ignore-file no-explicit-any
/// <reference path="./types.d.ts" />
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Test the deployed function behavior - verifying authentication works
const FUNCTION_URL = "https://kaglpfxsckjhqveybsdx.supabase.co/functions/v1/generate-cloudflare-token";

Deno.test("returns 401 when no authorization header is provided", async () => {
  const req = new Request(FUNCTION_URL, { 
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
  
  const resp = await fetch(req);
  assertEquals(resp.status, 401);
  
  const body = await resp.json();
  // Supabase returns its own auth error format
  assert(body.code === 401 && body.message.includes("authorization"));
});

Deno.test("returns 401 when invalid token is provided", async () => {
  const req = new Request(FUNCTION_URL, { 
    method: "POST",
    headers: {
      "Authorization": "Bearer invalid-token",
      "Content-Type": "application/json"
    }
  });
  
  const resp = await fetch(req);
  assertEquals(resp.status, 401);
  
  const body = await resp.json();
  // Supabase returns its own JWT validation error
  assert(body.code === 401 && body.message.includes("JWT"));
});