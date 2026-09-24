import { PayCardSessionSchema, type PayCardSession } from "@domain/api-card-management";
import { cardSession } from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import { getEnv } from "@shared/env";
import logger from "~/renderer/logger";
import type { AppDispatch } from "~/state-manager/configureStore";

/**
 * Starts the app with a Card session already in place, for local development and E2E.
 *
 * Desktop cannot complete the OAuth login today: the hosted page opens in the user's own browser and
 * reports nothing back (LIVE-34740). Until it can, a signed-in state has to be injected, and this is
 * the seam. The session token deliberately lives in renderer memory rather than the persisted redux
 * state, so a `userdata` fixture cannot carry it — an env var at launch is the one route that reaches
 * both `cardSession` and the `isSignedIn` flag.
 *
 * **This injects a bearer credential.** It is read from `process.env` at boot. Keeping it out of
 * `@shared/env` keeps `getAllEnvs()` — export-log metadata, the env debug UI, Allure
 * `environment.properties` — from serializing it. After the read, the process env is cleared so a
 * later dump of `process.env` is clear of it too. A later launch still receives the value if the
 * parent environment still has it.
 *
 * It runs in a development build, or in any build launched with `PLAYWRIGHT_RUN`. A packaged build
 * therefore honours it too when that variable is set, so exporting `CARD_SESSION_BOOTSTRAP` makes
 * the machine hold a live credential.
 *
 * The gate is a runtime check rather than a build-time constant (`__DEV__` / a `TESTING` define) on
 * purpose. Release-mode E2E runs against the release bundle — the workflow's `build_type: js`, which
 * its own input describes as "pick js for release testing" — and a build-time marker is by definition
 * absent there, so a compile-time gate would silently disable session injection in exactly the run
 * that most needs it. Please don't "harden" this to a define without solving that first.
 */
export async function bootstrapCardSession(dispatch: AppDispatch): Promise<void> {
  const raw = process.env.CARD_SESSION_BOOTSTRAP;
  if (raw) delete process.env.CARD_SESSION_BOOTSTRAP;

  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  if (!isDev && !getEnv("PLAYWRIGHT_RUN")) return;
  if (!raw) return;

  try {
    const session = parseSession(raw);
    await cardSession.set(session);
    dispatch(setSignedIn(true));
    // The token itself is never logged — only that a session was installed.
    logger.log("Card session bootstrapped from CARD_SESSION_BOOTSTRAP");
  } catch (error) {
    // A malformed value must fail loudly: silently starting signed-out would look like a product bug
    // rather than a configuration one.
    logger.error(
      `CARD_SESSION_BOOTSTRAP could not be applied: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}

const TOKEN_SENTINELS = new Set(["null", "undefined", "nil", "none", "false", "0"]);

function requireToken(value: unknown, field: "accessToken" | "refreshToken"): string {
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string`);
  }
  const token = value.trim();
  if (token === "" || TOKEN_SENTINELS.has(token.toLowerCase())) {
    throw new Error(`${field} must have a non-empty, non-sentinel value`);
  }
  return token;
}

/**
 * Validates a `CARD_SESSION_BOOTSTRAP` JSON payload. `readSession` only requires the access and
 * refresh token slots — the lifetimes slot is unused — so both tokens have to be present. The Baanx
 * password login returns no refresh token, so a caller using a real token must pass a placeholder
 * for it.
 *
 * `expiresIn` is schema-checked here so a malformed payload is rejected at bootstrap. It is not
 * persisted or enforced: `cardSession.set` keeps only the token slots, and an injected token is not
 * expiry-checked.
 *
 * Tokens are trimmed and string sentinels (`"null"`, `"undefined"`, …) are rejected on top of
 * `PayCardSessionSchema`: `z.string().min(1)` would otherwise accept `"null"` and pass it through as
 * `Authorization: Bearer null`.
 */
export function parseSession(raw: string): PayCardSession {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // V8 quotes the first ~10 characters of the input in its SyntaxError, so a
    // bare token pasted here would put part of the credential in the log. The
    // reason is reported without the value.
    throw new Error("value is not valid JSON");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("expected a JSON object");
  }

  const { accessToken, refreshToken, expiresIn } = parsed as Record<string, unknown>;

  return PayCardSessionSchema.parse({
    accessToken: requireToken(accessToken, "accessToken"),
    refreshToken: requireToken(refreshToken, "refreshToken"),
    expiresIn,
  });
}
