import { ENV_VARS, resolveBaanxAuthConfig } from "./config";
import { baanxRequest } from "./request";
import { getBaanxAuthToken } from "./auth/session";
import type { BaanxAuthSession, ResolvedBaanxAuthConfig } from "./types";

/**
 * Live integration test: log in for real, then call one authenticated endpoint.
 *
 * Excluded from `pnpm test` (see `testPathIgnorePatterns` in jest.config.js) —
 * it needs real credentials and real network. Run it with:
 *
 *   set -a; source .env; set +a      # or export the variables yourself
 *   pnpm --filter @ledgerhq/baanx-test-client test-integ
 *
 * Skips rather than fails when unconfigured, so it is harmless in CI without
 * secrets. One run costs a login (3 calls) plus 2 requests, and Baanx rate
 * limits the OTP trigger — don't run it in a tight loop.
 *
 * The endpoint is `GET /v1/user`, the one authenticated call Baanx documents:
 * https://docs.baanx.com/guides/user/authentication
 *
 * The profile it returns is real PII, so assertions compare booleans rather
 * than values wherever a failure diff would otherwise print personal data.
 */

const REQUIRED = [
  ENV_VARS.clientKey,
  ENV_VARS.email,
  ENV_VARS.password,
  ENV_VARS.totpSecret,
] as const;

const missing = REQUIRED.filter(name => !process.env[name]?.trim());
const describeLive = missing.length === 0 ? describe : describe.skip;

if (missing.length > 0) {
  console.log(`Skipping Baanx integration test — not configured. Missing: ${missing.join(", ")}`);
}

describeLive("Baanx live auth → GET /v1/user", () => {
  // Resolved in beforeAll, not in the describe body: Jest evaluates the body of
  // a skipped describe too, and resolving would throw when unconfigured.
  let config: ResolvedBaanxAuthConfig;
  let session: BaanxAuthSession;
  let profile: Record<string, unknown>;
  let status: number;

  // One login and one profile fetch for the whole suite, to stay under the
  // rate limit. The negative control below reuses the same session.
  beforeAll(async () => {
    config = resolveBaanxAuthConfig();
    session = await getBaanxAuthToken();

    // Exercises the real consumer path: baanxRequest attaches the bearer
    // token, the client key and the region header on its own.
    const response = await baanxRequest<Record<string, unknown>>({ path: "/v1/user" });
    status = response.status;
    profile = response.data;
  });

  it("logs in and returns a usable token", () => {
    expect(session.accessToken).toBeTruthy();
    // The failure this whole package exists to prevent.
    expect(session.accessToken).not.toBe("null");
    expect(session.expiresAt > session.issuedAt).toBe(true);
  });

  it("authenticates GET /v1/user", () => {
    expect(status).toBe(200);
    // Cross-realm safe: undici's object has a different Object constructor.
    expect(typeof profile).toBe("object");
    expect(profile).not.toBeNull();
  });

  it("returns the profile of the user we logged in as", () => {
    // A UUID, safe to diff on failure.
    expect(profile.id).toBe(session.userId);

    // Compared as a boolean so a failure never prints the address book.
    const emailMatches =
      typeof profile.email === "string" &&
      profile.email.toLowerCase() === config.email.toLowerCase();
    expect(emailMatches).toBe(true);

    expect(profile.verificationState).toBe(session.verificationState);
  });

  it("rejects the same request with a bogus token", async () => {
    // Negative control: without this, the test above would still pass if
    // /v1/user were unauthenticated, telling us nothing about the token.
    const response = await fetch(`${config.baseUrl}/v1/user`, {
      headers: {
        "x-client-key": config.clientKey,
        authorization: "Bearer not-a-real-token",
        ...(config.region === "us" ? { "x-us-env": "true" } : {}),
      },
    });

    expect(response.status).not.toBe(200);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
