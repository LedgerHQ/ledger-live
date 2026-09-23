import Config from "react-native-config";
import { LaunchArguments } from "react-native-launch-arguments";
import { PayCardSessionSchema, type PayCardSession } from "@domain/api-card-management";
import { cardSession } from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import type { AppDispatch } from "~/state-manager/configureStore";

/**
 * Starts the app with a Card session already in place, for local development and E2E.
 *
 * The session token lives in the keychain rather than persisted redux state, so an env var at
 * launch is the route that reaches both `cardSession` and the `isSignedIn` flag.
 *
 * **This injects a bearer credential.** Keeping it out of `@shared/env` keeps `getAllEnvs()` from
 * serializing it. Detox supplies it via launch arguments; Metro local reads `process.env` only in
 * `__DEV__` so a release/Detox binary cannot pick up a value inlined at compile.
 *
 * Honour it in a development build, or in any build launched with `Config.DETOX`. The gate is a
 * runtime check rather than a define so release-mode E2E, which tests the release bundle, can still
 * inject a session. A Detox launch with no payload also clears any leftover keychain session, so a
 * run that wants no card cannot inherit one from a previous launch. Metro without a payload leaves
 * an existing session alone.
 */
export async function bootstrapCardSession(dispatch: AppDispatch): Promise<void> {
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  const isDetox = Boolean(Config.DETOX);
  if (!isDev && !isDetox) return;

  const raw = readBootstrapPayload();
  if (raw === undefined) {
    if (isDetox) {
      await cardSession.clear();
    }
    return;
  }

  try {
    const session = parseSession(raw);
    await cardSession.set(session);
    dispatch(setSignedIn(true));
    // Warn, not log: `@ledgerhq/logs` is filtered by VERBOSE
    console.warn("CARD_SESSION_BOOTSTRAP applied: the app is signed in with an injected session");
  } catch (error) {
    console.error(
      `CARD_SESSION_BOOTSTRAP could not be applied: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
}

function readBootstrapPayload(): unknown {
  const fromLaunch = LaunchArguments?.value?.()?.CARD_SESSION_BOOTSTRAP;
  if (fromLaunch !== undefined && fromLaunch !== "") {
    return fromLaunch;
  }

  /**
   * `babel-plugin-transform-inline-environment-variables` rewrites this read into a string literal
   * while bundling, so a release build made in a shell that exports the token would carry the token
   * itself in the shipped JavaScript. The literal `__DEV__` keeps that literal inside a branch the
   * release bundler drops; a runtime check would not, because the flag would reach it as a variable
   * the minifier cannot fold. Read `__DEV__` here directly, and never through a parameter.
   */
  if (__DEV__) {
    const fromProcess = process.env.CARD_SESSION_BOOTSTRAP;
    if (fromProcess) delete process.env.CARD_SESSION_BOOTSTRAP;
    return fromProcess;
  }

  return undefined;
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

export function parseSession(raw: unknown): PayCardSession {
  const parsed = decodePayload(raw);

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

function decodePayload(raw: unknown): unknown {
  if (typeof raw !== "string") {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("value is not valid JSON");
  }
}
