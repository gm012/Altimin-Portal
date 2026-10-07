import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.2.12";

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing server configuration: " + name);
  return value;
}
export function database() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function allowedOrigins() {
  return env("PORTAL_ALLOWED_ORIGINS").split(",").map(x => x.trim()).filter(Boolean);
}
export function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  return {
    ...(allowedOrigins().includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
  };
}
export function reply(body: unknown, status = 200, headers: Record<string,string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store", ...headers,
  } });
}
let jwks: ReturnType<typeof createRemoteJWKSet>;
export async function verifiedSubject(request: Request): Promise<string> {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("invalid_session");
  const issuer = env("CLERK_ISSUER").replace(/\/$/, "");
  if (!issuer.startsWith("https://")) throw new Error("invalid_issuer");
  jwks ??= createRemoteJWKSet(new URL(issuer + "/.well-known/jwks.json"));
  const { payload } = await jwtVerify(authorization.slice(7), jwks, {
    issuer, algorithms: ["RS256"], requiredClaims: ["sub", "exp", "iat", "azp"],
    clockTolerance: 5,
  });
  if (!payload.sub?.startsWith("user_") || !allowedOrigins().includes(String(payload.azp))) {
    throw new Error("invalid_session");
  }
  return payload.sub;
}

