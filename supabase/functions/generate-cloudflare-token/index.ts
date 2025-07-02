/// <reference path="./types.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const CF_MASTER_TOKEN = Deno.env.get('CF_MASTER_TOKEN');
    const CF_ACCOUNT_ID = Deno.env.get('CF_ACCOUNT_ID');
    
    // Check required environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), {
        status: 500
      });
    }
    
    if (!CF_MASTER_TOKEN || !CF_ACCOUNT_ID) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }
    
    // Authenticate user with Supabase
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
    
    // Generate a user-scoped Cloudflare API token for AI Gateway
    const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/api/tokens`;

    // Set expiry for 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Build the request body for a generic account-scoped token (no explicit permission_groups)
    const tokenRequestBody = {
      name: `ai-gateway-${user.id}-${Date.now()}`,
      policies: [
        {
          effect: "allow",
          resources: {
            [`com.cloudflare.api.account.${CF_ACCOUNT_ID}`]: "*"
          }
        }
      ],
      expires_on: expiresAt,
      metadata: {
        user_id: user.id
      }
    };

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
        const cfError = cfData.errors ? JSON.stringify(cfData.errors) : "Unknown error";
        console.error("Cloudflare API error:", cfError);
        return new Response(JSON.stringify({ error: "Cloudflare token generation failed" }), { status: 502 });
      }

      return new Response(JSON.stringify({
        cloudflareToken: cfData.result.value
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 200
      });
      
    } catch (err) {
      console.error("Cloudflare token generation failed:", err);
      return new Response(JSON.stringify({ error: "Cloudflare token generation failed" }), { status: 502 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
