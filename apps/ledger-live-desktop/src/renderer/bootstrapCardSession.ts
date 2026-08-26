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
 * **This injects a bearer credential, so it is gated twice.** It runs only in a development build or
 * under `PLAYWRIGHT_RUN`; a packaged production app ignores the variable entirely, even if it is set.
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
 * lifetimes all agree, so every field has to be present. The Baanx password login returns no refresh
 * token, so a caller using a real token must pass a placeholder for it.
 */
function parseSession(raw: string) {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("expected a JSON object");
  }

  const { accessToken, refreshToken, expiresIn, refreshTokenExpiresIn } = parsed as Record<
    string,
    unknown
  >;

  const missing = Object.entries({ accessToken, refreshToken, expiresIn, refreshTokenExpiresIn })
    .filter(([, value]) => value === undefined || value === "")
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`missing field(s): ${missing.join(", ")}`);
  }

  return {
    accessToken: String(accessToken),
    refreshToken: String(refreshToken),
    expiresIn: Number(expiresIn),
    refreshTokenExpiresIn: Number(refreshTokenExpiresIn),
  };
}
