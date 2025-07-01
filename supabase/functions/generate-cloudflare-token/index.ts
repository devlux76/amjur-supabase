/// <reference path="./types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), {
        status: 500
      });
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'User not authenticated'
      }), {
        status: 401
      });
    }
    // Generate Cloudflare AI Gateway token via Cloudflare API
    const CF_MASTER_TOKEN = Deno.env.get('CF_MASTER_TOKEN');
    if (!CF_MASTER_TOKEN) {
      console.error('CF_MASTER_TOKEN not set');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }

    // Cloudflare API endpoint for token creation (replace with actual endpoint if needed)
    const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/access/service_tokens"; // Placeholder, update as needed

    // Prepare token request body
    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    const expiresAt = now + oneHour;

    const tokenRequestBody = {
      name: `ai-gateway-${user.id}-${now}`,
      expires_on: new Date(expiresAt * 1000).toISOString(),
      policies: [
        {
          permission_groups: ["ai.gateway.run"],
          // Restrict to your gateway/resource as needed
        }
      ],
      metadata: {
        user_id: user.id
      }
    };

    let cloudflareToken: string | null = null;
    let cfError: string | null = null;

    try {
      const cfResp = await fetch(CLOUDFLARE_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CF_MASTER_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tokenRequestBody)
      });
      const cfData = await cfResp.json();
      if (!cfResp.ok || !cfData.result?.value) {
        cfError = cfData.errors ? JSON.stringify(cfData.errors) : "Unknown error";
        throw new Error(cfError);
      }
      cloudflareToken = cfData.result.value;
    } catch (err) {
      console.error("Cloudflare token generation failed:", err);
      return new Response(JSON.stringify({ error: "Cloudflare token generation failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({
      cloudflareToken
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
