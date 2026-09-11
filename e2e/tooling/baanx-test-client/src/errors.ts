/**
 * Typed errors for every way a Baanx login can fail.
 *
 * Two rules hold across this file:
 *
 * 1. **No secrets in messages.** Passwords, the client key, the TOTP secret and
 *    generated codes never reach an error string. Env vars are named, never
 *    valued. Raw bodies are passed through `redactBody` before being attached.
 * 2. **Surface Baanx's own message.** A test failing on "account locked" should
 *    say so, not "request failed".
 */

/** Base class — catch this to catch anything this package throws. */
export class BaanxAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Required configuration is missing. Lists variable *names* only. */
export class BaanxConfigError extends BaanxAuthError {
  readonly missingVars: readonly string[];

  constructor(missingVars: readonly string[]) {
    super(
      `Baanx test auth is not configured. Set ${missingVars.join(", ")} in your environment ` +
        `(see e2e/tooling/baanx-test-client/README.md).`,
    );
    this.missingVars = missingVars;
  }
}

/**
 * A configuration value is present but malformed.
 *
 * Only enumerable, non-secret values are quoted back (a region, a digit count).
 * Never the client key, the password or the setup key.
 */
export class BaanxInvalidConfigError extends BaanxAuthError {
  constructor(variable: string, expected: string) {
    super(`${variable} is invalid: expected ${expected}.`);
  }
}

/** The host could not be reached at all. Carries no request detail. */
export class BaanxTransportError extends BaanxAuthError {
  constructor(baseUrl: string, reason: string) {
    super(`Could not reach ${baseUrl}: ${reason}`);
  }
}

/**
 * 200 OK, but `phase` says the user never finished onboarding. There will be
 * no token for this user until somebody completes it in the Baanx UI.
 */
export class BaanxOnboardingIncompleteError extends BaanxAuthError {
  readonly phase: string;
  readonly userId: string | null;

  constructor(phase: string, userId: string | null) {
    super(
      `Baanx test user has not finished onboarding — stopped at phase "${phase}". ` +
        `No access token exists for this user; finish onboarding or use a different test user.`,
    );
    this.phase = phase;
    this.userId = userId;
  }
}

/** 498 — the client key was sent but Baanx rejected it. */
export class BaanxInvalidClientKeyError extends BaanxAuthError {
  readonly status = 498;

  constructor(apiMessage: string | null, clientKeyVar: string) {
    super(
      `${apiMessage ?? "Baanx rejected the client key (498 Invalid Token)."} ` +
        `${clientKeyVar} is set but not accepted by this environment — sandbox needs its own key, ` +
        `the app's configured value will not work.`,
    );
  }
}

/** 499 — no client key reached Baanx. */
export class BaanxMissingClientKeyError extends BaanxAuthError {
  readonly status = 499;

  constructor(apiMessage: string | null, clientKeyVar: string) {
    super(
      `${apiMessage ?? "Baanx received no client key (499 Token Required)."} ` +
        `${clientKeyVar} looks empty.`,
    );
  }
}

/** 401 — bad email/password, or the account is locked. */
export class BaanxInvalidCredentialsError extends BaanxAuthError {
  readonly status = 401;
  readonly accountLocked: boolean;

  constructor(apiMessage: string | null, accountLocked: boolean) {
    super(
      accountLocked
        ? `${apiMessage ?? "Baanx reports this account as locked."} ` +
            `Repeated failed logins lock the user — wait it out or have it unlocked; retrying will not help.`
        : `${apiMessage ?? "Invalid credentials — Baanx rejected this login."} ` +
            `Check the email and password, and that this user exists in this environment and region.`,
    );
    this.accountLocked = accountLocked;
  }
}

/** 429 — rate limited. Usually a suite logging in once per worker. */
export class BaanxRateLimitError extends BaanxAuthError {
  readonly status = 429;
  readonly retryAfter: string | null;

  constructor(apiMessage: string | null, retryAfter: string | null) {
    super(
      `${apiMessage ?? "Rate limited by Baanx (429)."} ` +
        (retryAfter ? `Retry-After: ${retryAfter}.` : "No Retry-After header was returned.") +
        ` If this hit during a parallel run, share one token across workers instead of ` +
        `logging in per worker (see e2e/tooling/baanx-test-client/README.md).`,
    );
    this.retryAfter = retryAfter;
  }
}

/** Any other non-2xx. */
export class BaanxHttpError extends BaanxAuthError {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, apiMessage: string | null, body: unknown) {
    super(apiMessage ?? `Baanx returned HTTP ${status} with no message.`);
    this.status = status;
    this.body = body;
  }
}

/**
 * The configured TOTP setup key is not usable base32.
 *
 * The offending value is never included — only the variable to go and fix.
 */
export class BaanxTotpSecretError extends BaanxAuthError {
  constructor(secretVar: string) {
    super(
      `The TOTP setup key in ${secretVar} is not valid base32. Copy the setup key exactly as the ` +
        `authenticator enrolment showed it (letters A-Z and digits 2-7; spaces and padding are fine).`,
    );
  }
}

/** The OTP challenge could not be completed. */
export class BaanxOtpError extends BaanxAuthError {
  readonly body: unknown;

  constructor(message: string, body?: unknown) {
    super(message);
    this.body = body;
  }
}

/**
 * 200 OK, no token, and nothing in the body explains why. Never let this
 * become `Bearer null` downstream — the redacted body is attached so the
 * failure is debuggable.
 */
export class BaanxNoTokenError extends BaanxAuthError {
  readonly body: unknown;

  constructor(body: unknown) {
    super(
      "Baanx returned 200 with no accessToken, no phase and no OTP challenge. " +
        "Nothing in the response explains why — inspect `error.body` for the redacted payload.",
    );
    this.body = body;
  }
}
