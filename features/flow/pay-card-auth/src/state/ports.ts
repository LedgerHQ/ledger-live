import type {
  PayCardAuthorizationCodeRequest,
  PayCardAuthorizeInitiate,
  PayCardAuthorizeInitiateRequest,
  PayCardSession,
  PayCardUser,
} from "@domain/api-card-management";
import type { PayCardAuthorizeAttempt, PayCardStoredAttempt } from "./types";

/**
 * What the OS browser reports when it closes. `success` carries the URL the session stopped on, which
 * is the redirect; `dismissed` covers every way the user left without one.
 */
export type HostedLoginResult =
  | Readonly<{ type: "success"; url: string }>
  | Readonly<{ type: "dismissed" }>;

export type OpenHostedLogin = (loginUrl: string, redirectUri: string) => Promise<HostedLoginResult>;

/**
 * Everything the login machine needs from the outside world. The machine itself holds no React, no
 * redux, no platform API — the ViewModel binds these to RTK Query, to the PKCE store and to the
 * platform-card session store.
 */
export type CardLoginPorts = Readonly<{
  /** Mints a fresh CSRF state and PKCE pair. */
  createAttempt: () => Promise<PayCardAuthorizeAttempt>;
  saveAttempt: (attempt: PayCardStoredAttempt) => Promise<void>;
  loadAttempt: () => Promise<PayCardStoredAttempt | null>;
  clearAttempt: () => Promise<void>;
  /** True when a Card session is already on disk. */
  hasSession: () => Promise<boolean>;
  persistSession: (session: PayCardSession) => Promise<void>;
  clearSession: () => Promise<void>;
  initiateAuthorize: (
    request: PayCardAuthorizeInitiateRequest,
  ) => Promise<PayCardAuthorizeInitiate>;
  exchangeAuthorizationCode: (request: PayCardAuthorizationCodeRequest) => Promise<PayCardSession>;
  /** Fills the RTK Query cache, so every other screen sees the user too. */
  getUser: () => Promise<PayCardUser>;
  openHostedLogin: OpenHostedLogin;
}>;
