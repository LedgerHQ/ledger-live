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
 * **This injects a bearer credential.** It runs in a development build, or in any build launched with
 * `PLAYWRIGHT_RUN` — which the Playwright fixture sets on the Electron process it spawns. A packaged
 * build therefore honours it too when that variable is set, so exporting `CARD_SESSION_BOOTSTRAP`
 * makes the machine hold a live credential.
 *
 * The gate is a runtime check rather than a build-time constant (`__DEV__` / a `TESTING` define) on
 * purpose. Release-mode E2E runs against the release bundle — the workflow's `build_type: js`, which
 * its own input describes as "pick js for release testing" — and a build-time marker is by definition
 * absent there, so a compile-time gate would silently disable session injection in exactly the run
 * that most needs it. Please don't "harden" this to a define without solving that first.
 */
export async function bootstrapCardSession(dispatch: AppDispatch): Promise<void> {
  if (!__DEV__ && !getEnv("PLAYWRIGHT_RUN")) return;

  const raw = getEnv("CARD_SESSION_BOOTSTRAP");
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

/**
 * `readSession` treats a session as valid only when the access token, the refresh token and the
 * lifetimes all agree, so all three fields have to be present. The Baanx password login returns no
 * refresh token, so a caller using a real token must pass a placeholder for it.
 *
 * Values are validated rather than coerced: `String(null)` would smuggle in the token `"null"`, and
 * `Number(undefined)` an expiry of `NaN`, which is exactly the broken-session state the app guards
 * against everywhere else.
 *
 * Intentionally unannotated: `cardSession.set` supplies the type, so a future change to
 * `PayCardSession` fails to compile here instead of silently bootstrapping a stale shape — which is
 * how the dropped `refreshTokenExpiresIn` slipped through once already.
 */
function parseSession(raw: string) {
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

  if (typeof accessToken !== "string" || accessToken.trim() === "") {
    throw new Error("accessToken must be a non-empty string");
  }
  if (typeof refreshToken !== "string" || refreshToken.trim() === "") {
    throw new Error("refreshToken must be a non-empty string");
  }
  // The app schema is z.number().int().positive(), so a float is not a valid session.
  if (typeof expiresIn !== "number" || !Number.isInteger(expiresIn) || expiresIn <= 0) {
    throw new Error("expiresIn must be a positive whole number of seconds");
  }

  return { accessToken, refreshToken, expiresIn };
}
