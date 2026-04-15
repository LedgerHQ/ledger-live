import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { BaanxSandboxState, BaanxSandboxViewModel, OAuthSession, OAuthTokens } from "./types";

const BASE_URL = process.env.BAANX_API_BASE_URL || "https://dev.api.baanx.com";
const CLIENT_KEY = process.env.BAANX_CLIENT_KEY || "";
const SECRET_KEY = process.env.BAANX_SECRET_KEY || "";
const REDIRECT_URI = "https://localhost/oauth/callback";

// ---------------------------------------------------------------------------
// PKCE helpers (Web Crypto API — available in Electron renderer)
// ---------------------------------------------------------------------------

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(new Uint8Array(digest));
}

function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// Typed fetch wrapper
// ---------------------------------------------------------------------------

async function baanxFetch<T>(
  path: string,
  init?: RequestInit,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-client-key": CLIENT_KEY,
      ...extraHeaders,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body: { error_description?: string; message?: string } = await res
      .json()
      .catch(() => ({}));
    throw new Error(`${res.status} — ${body.error_description ?? body.message ?? res.statusText}`);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return res.json() as unknown as T;
}

// ---------------------------------------------------------------------------
// OAuth API-mode steps
// ---------------------------------------------------------------------------

async function initiateOAuth(): Promise<OAuthSession> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const params = new URLSearchParams({
    mode: "api",
    response_type: "code",
    client_id: CLIENT_KEY,
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const data = await baanxFetch<{ token: string }>(
    `/v1/auth/oauth/authorize/initiate?${params.toString()}`,
    { method: "GET" },
    { "x-secret-key": SECRET_KEY },
  );

  return { jwtToken: data.token, codeVerifier, state };
}

async function loginUser(email: string, password: string): Promise<string> {
  const data = await baanxFetch<{ accessToken: string }>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.accessToken;
}

async function generateAuthCode(
  session: OAuthSession,
  tempAccessToken: string,
): Promise<{ code: string; state: string }> {
  return baanxFetch<{ code: string; state: string }>("/v1/auth/oauth/authorize", {
    method: "POST",
    headers: { Authorization: `Bearer ${tempAccessToken}` },
    body: JSON.stringify({ token: session.jwtToken }),
  });
}

async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokens> {
  return baanxFetch<OAuthTokens>(
    "/v1/auth/oauth/token",
    {
      method: "POST",
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    },
    { "x-secret-key": SECRET_KEY },
  );
}

async function fetchProfile(accessToken: string): Promise<Record<string, unknown>> {
  return baanxFetch<Record<string, unknown>>("/v1/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ---------------------------------------------------------------------------
// ViewModel
// ---------------------------------------------------------------------------

export default function useBaanxSandboxViewModel(): BaanxSandboxViewModel {
  const navigate = useNavigate();
  const [state, setState] = useState<BaanxSandboxState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const tokensRef = useRef<OAuthTokens | null>(null);

  const login = useCallback(async () => {
    try {
      // Step 1 — Initiate OAuth (PKCE)
      setState({ kind: "in-progress", step: "initiating" });
      const session = await initiateOAuth();

      // Step 2 — Login user
      setState({ kind: "in-progress", step: "logging-in" });
      const tempToken = await loginUser(email, password);

      // Step 3 — Generate authorization code
      setState({ kind: "in-progress", step: "authorizing" });
      const { code, state: returnedState } = await generateAuthCode(session, tempToken);

      if (returnedState !== session.state) {
        throw new Error("State parameter mismatch — possible CSRF attack");
      }

      // Step 4 — Exchange code for long-lived tokens
      setState({ kind: "in-progress", step: "exchanging" });
      const tokens = await exchangeCodeForTokens(code, session.codeVerifier);
      tokensRef.current = tokens;

      // Step 5 — Fetch user profile
      setState({ kind: "in-progress", step: "fetching-profile" });
      const profile = await fetchProfile(tokens.access_token);

      setState({ kind: "authenticated", profile });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }, [email, password]);

  const logout = useCallback(() => {
    tokensRef.current = null;
    setState({ kind: "idle" });
  }, []);

  const navigateBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return { state, email, password, setEmail, setPassword, login, logout, navigateBack };
}
