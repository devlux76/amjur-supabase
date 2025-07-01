// Type declarations for Deno environment in Supabase Edge Functions
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "jsr:@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}

declare module "jsr:@supabase/functions-js/edge-runtime.d.ts" {
  // This module provides runtime type definitions
}
