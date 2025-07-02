// Type declarations for Supabase Edge Functions

declare module "supabase" {
  export function createClient(url: string, key: string, options?: any): any;
}

declare module "jsr:@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: any): any;
}

declare module "jsr:@supabase/functions-js/edge-runtime.d.ts" {
  // This module provides runtime type definitions
}

// Extend ImportMeta for Deno's specific properties
interface ImportMeta {
  main: boolean;
}
