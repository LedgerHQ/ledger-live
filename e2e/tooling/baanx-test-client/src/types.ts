/**
 * The public contract of this package.
 *
 * Nothing here carries a secret except the fields a caller hands us
 * (`password`, `totp.secret`) and the token we hand back. `BaanxAuthSession` is
 * the only shape that holds a credential, and it exists because returning the
 * token is the entire point.
 */

/** Baanx routes US-region users on a separate tenant, selected by `x-us-env`. */
export type BaanxRegion = "international" | "us";

/** Onboarding steps Baanx reports in `phase` when a login cannot complete. */
export const ONBOARDING_PHASES = [
  "ACCOUNT",
  "PHONE_NUMBER",
  "PERSONAL_INFORMATION",
  "PHYSICAL_ADDRESS",
  "MAILING_ADDRESS",
] as const;

export type BaanxOnboardingPhase = (typeof ONBOARDING_PHASES)[number];

export type TotpAlgorithm = "SHA1" | "SHA256" | "SHA512";

/** Sandbox host. Injectable so another environment can be swapped in later. */
export const DEFAULT_BAANX_BASE_URL = "https://dev.api.baanx.com";

/** Baanx documents access tokens as lasting 6h. Used when the JWT has no `exp`. */
export const ASSUMED_TOKEN_LIFETIME_MS = 21_600_000;

/** Standard TOTP parameters (RFC 6238); every one is overridable. */
export const DEFAULT_TOTP_DIGITS = 6;
export const DEFAULT_TOTP_PERIOD_S = 30;
export const DEFAULT_TOTP_ALGORITHM: TotpAlgorithm = "SHA1";

/**
 * A code with less than this left to live is not worth sending — it can expire
 * between our request and Baanx validating it. A real source of flaky auth.
 */
export const MIN_WINDOW_REMAINING_MS = 2_000;

/** Re-authenticate this long before expiry rather than racing the deadline. */
export const TOKEN_REFRESH_MARGIN_MS = 300_000;

export interface BaanxTotpConfig {
  /**
   * The authenticator **setup key** (base32 secret) for the test user. Comes
   * from configuration only — never a literal, never a CLI flag.
   */
  secret: string;
  digits?: number;
  /** Window length in seconds. */
  period?: number;
  algorithm?: TotpAlgorithm;
}

export interface BaanxAuthConfig {
  /** Defaults to {@link DEFAULT_BAANX_BASE_URL}. Trailing slashes are trimmed. */
  baseUrl?: string;
  /** Baanx `x-client-key`. Sandbox needs its own; the app's value will not do. */
  clientKey: string;
  email: string;
  password: string;
  /** Defaults to `"international"`. */
  region?: BaanxRegion;
  totp: BaanxTotpConfig;
}

/** Every optional field filled in. What the flow actually runs against. */
export interface ResolvedBaanxAuthConfig {
  baseUrl: string;
  clientKey: string;
  email: string;
  password: string;
  region: BaanxRegion;
  totp: Required<BaanxTotpConfig>;
}

export interface BaanxAuthSession {
  accessToken: string;
  userId: string | null;
  /** ISO timestamp of when we received the token. */
  issuedAt: string;
  /** ISO timestamp. The JWT `exp` when readable, else issuedAt + 6h. */
  expiresAt: string;
  expirySource: "token" | "assumed";
  /** Whether an OTP challenge had to be answered to get here. */
  otpUsed: boolean;
  /** Baanx KYC state — useful when a test fails on an unverified user. */
  verificationState: string | null;
  isLinked: boolean | null;
  /** Which host and tenant issued this, for debugging a cross-env mixup. */
  baseUrl: string;
  region: BaanxRegion;
  /** The test user this belongs to. Not a secret; the password is. */
  email: string;
}

/* -------------------------------------------------------------------------- */
/* Injection points                                                           */
/*                                                                            */
/* These live here rather than beside their implementations because they are  */
/* reachable from the public API (`BaanxAuthTokenOptions.deps`,               */
/* `BaanxRequestOptions.fetchImpl`), while the modules that use them are not. */
/* -------------------------------------------------------------------------- */

/** The `fetch` implementation to use. Injected so tests never hit the network. */
export type FetchImpl = typeof globalThis.fetch;

/** Clock used for TOTP timing. Injected so no test depends on wall time. */
export interface TotpClock {
  /** Milliseconds since the epoch. */
  now(): number;
  sleep(ms: number): Promise<void>;
}

/** Transport and clock overrides for the login flow. */
export interface LoginDeps {
  fetchImpl?: FetchImpl;
  clock?: TotpClock;
  /** Overridable so a test can force the window-rollover branch. */
  minWindowRemainingMs?: number;
}
