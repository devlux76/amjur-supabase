# ISSUE

**Title:** Align Edge Function with Supabase MCP Recommendations

**Description:**
Update the Cloudflare token generation Edge Function to follow Supabase MCP best practices:
- Export the handler as default from [`index.ts`](index.ts)
- Use Deno's test runner and place tests in [`index.test.ts`](index.test.ts)
- Use Supabase CLI for local integration testing
- Ensure `deno.json`, `import_map.json`, and `types.d.ts` are present and correct
- Remove Node.js-specific code

**Status:**
Open