import * as publicApi from "./index";

/**
 * The barrel is the package's contract. Anything listed here is something we
 * promise to keep working, so growing it should be a deliberate edit to this
 * test — not a side effect of adding `export *` to a module.
 *
 * Internals (transport, TOTP derivation, the uncached login, body redaction)
 * stay out on purpose: they change freely, and no consumer should reach them.
 */

const PUBLIC_EXPORTS = [
  // Entry points
  "getBaanxAuthToken",
  "clearBaanxAuthCache",
  "baanxRequest",
  // Configuration
  "ENV_VARS",
  "resolveBaanxAuthConfig",
  // Errors
  "BaanxAuthError",
  "BaanxConfigError",
  "BaanxHttpError",
  "BaanxInvalidClientKeyError",
  "BaanxInvalidConfigError",
  "BaanxInvalidCredentialsError",
  "BaanxMissingClientKeyError",
  "BaanxNoTokenError",
  "BaanxOnboardingIncompleteError",
  "BaanxOtpError",
  "BaanxRateLimitError",
  "BaanxTotpSecretError",
  "BaanxTransportError",
  // Constants
  "ASSUMED_TOKEN_LIFETIME_MS",
  "DEFAULT_BAANX_BASE_URL",
  "DEFAULT_TOTP_ALGORITHM",
  "DEFAULT_TOTP_DIGITS",
  "DEFAULT_TOTP_PERIOD_S",
  "MIN_WINDOW_REMAINING_MS",
  "ONBOARDING_PHASES",
  "TOKEN_REFRESH_MARGIN_MS",
].sort();

/** Names that must never become part of the contract. */
const INTERNALS = [
  "sendJson",
  "toTypedError",
  "redactBody",
  "asRecord",
  "asString",
  "asBoolean",
  "extractApiMessage",
  "looksAccountLocked",
  "loginToBaanx",
  "generateTotpCodeAt",
  "generateFreshTotpCode",
  "totpWindow",
  "systemClock",
  "readJwtExpiry",
  "resolveExpiry",
  "parseCliArgs",
];

describe("public API", () => {
  it("exports exactly the documented surface", () => {
    expect(Object.keys(publicApi).sort()).toEqual(PUBLIC_EXPORTS);
  });

  it.each(INTERNALS)("does not leak %s", name => {
    expect(publicApi).not.toHaveProperty(name);
  });
});
