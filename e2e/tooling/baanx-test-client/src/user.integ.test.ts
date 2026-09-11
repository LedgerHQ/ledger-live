import { ENV_VARS, resolveBaanxAuthConfig } from "./config";
import { getBaanxAuthToken } from "./auth/session";
import type { BaanxAuthSession, ResolvedBaanxAuthConfig } from "./types";

/**
 * Live integration test: log in against the real sandbox.
 *
 * Excluded from `pnpm test` (see `testPathIgnorePatterns` in jest.config.js).
 * Run it with:
 *
 *   set -a; source .env; set +a
 *   pnpm --filter @ledgerhq/baanx-test-client test-integ
 *
 * Skips rather than fails when unconfigured. One run costs a login (up to 3
 * calls). Baanx rate limits the OTP trigger — don't run it in a tight loop.
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
  console.log(
    "Skipping Baanx integration test — not configured (required auth environment variables are missing).",
  );
}

describeLive("Baanx live login", () => {
  let config: ResolvedBaanxAuthConfig;
  let session: BaanxAuthSession;

  beforeAll(async () => {
    config = resolveBaanxAuthConfig();
    session = await getBaanxAuthToken();
  });

  it("returns a usable token", () => {
    expect(session.accessToken).toBeTruthy();
    expect(session.accessToken).not.toBe("null");
    expect(session.expiresAt > session.issuedAt).toBe(true);
    expect(session.email.toLowerCase()).toBe(config.email.toLowerCase());
  });
});
