import type { StoredCardSession } from "@features/platform-card";
import { fromPromise } from "xstate";
import { buildAuthorizeUrl } from "./buildAuthorizeUrl";
import { parseCallbackUrl } from "./callbackUrl";
import { MissingLoginStateError } from "./errors";
import type { PayCardLoginErrorKind } from "./errors";
import type { CardLoginOauthConfig, CardLoginPorts, PayCardAuthCallback } from "./types";

/**
 * Every asynchronous step of the login, as an invoked actor. Each one takes what it needs as input and
 * answers with a value the machine can branch on — no actor reaches for the context, and none of them
 * knows which state invoked it.
 */

/** Reads whether a login attempt and a session are on disk. No writes: see `clearingAttempt`. */
export const hydrate = fromPromise(async ({ input }: { input: { ports: CardLoginPorts } }) => {
  const [attempt, hasSession] = await Promise.all([
    input.ports.loadAttempt(),
    input.ports.hasSession(),
  ]);

  return { hasAttempt: attempt !== null, hasSession };
});

/**
 * Mints the attempt, stores it, and builds the URL that opens it. The URL is built here and not in an
 * `assign`, because `buildAuthorizeUrl` throws on a misconfigured `apiUrl`, and a throw inside an
 * action stops the machine instead of reaching a transition. As a rejection it lands on `onError`, and
 * the login reports a failure it can retry.
 */
export const prepareAttempt = fromPromise(
  async ({
    input,
  }: {
    input: { ports: CardLoginPorts; oauthConfig: CardLoginOauthConfig };
  }): Promise<{ loginUrl: string }> => {
    const { codeVerifier, codeChallenge } = await input.ports.createAttempt();
    await input.ports.saveAttempt({ codeVerifier });

    // Only the challenge leaves the device. The verifier stays in the store until the token exchange.
    return { loginUrl: buildAuthorizeUrl(input.oauthConfig, codeChallenge) };
  },
);

/**
 * Opens the OS browser and reports the redirect it stopped on. A dismissal and a redirect without a
 * code are the same answer here: no callback, so the attempt ends without a message.
 */
export const openHostedLogin = fromPromise(
  async ({
    input,
  }: {
    input: { ports: CardLoginPorts; loginUrl: string | null; deepLink?: string };
  }) => {
    if (!input.loginUrl) {
      throw new MissingLoginStateError("URL");
    }

    const result = await input.ports.openHostedLogin(input.loginUrl, input.deepLink);

    return { callback: result.type === "success" ? parseCallbackUrl(result.url) : null };
  },
);

/**
 * Checks that a redirect and the attempt behind it are both there. Nothing is compared: the OAuth
 * `state` is gone, so there are no two values to hold against each other. `kind` is null when both
 * are present.
 */
export const validateCallback = fromPromise(
  async ({
    input,
  }: {
    input: { ports: CardLoginPorts; callback: PayCardAuthCallback | null };
  }): Promise<{ kind: PayCardLoginErrorKind | null }> => {
    const attempt = await input.ports.loadAttempt();

    // A redirect with no verifier behind it cannot be exchanged, so the login starts over. PKCE does
    // the rest: the provider only accepts this code against the challenge this attempt sent.
    return { kind: attempt && input.callback ? null : "missing_attempt" };
  },
);

export const exchangeAuthorizationCode = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts; callback: PayCardAuthCallback | null } }) => {
    const attempt = await input.ports.loadAttempt();
    if (!attempt || !input.callback) {
      throw new MissingLoginStateError("attempt");
    }

    return input.ports.exchangeAuthorizationCode({
      code: input.callback.code,
      codeVerifier: attempt.codeVerifier,
    });
  },
);

export const persistSession = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts; session: StoredCardSession | null } }) => {
    if (!input.session) {
      throw new MissingLoginStateError("session");
    }

    await input.ports.persistSession(input.session);

    // Wiping the attempt is hygiene, and the session is already on disk. A store that refuses to
    // forget must not report a login that succeeded as `persist_failed`.
    await input.ports.clearAttempt().catch(() => undefined);
  },
);

export const getUser = fromPromise(({ input }: { input: { ports: CardLoginPorts } }) =>
  input.ports.getUser(),
);

/**
 * Best effort by design. A store that refuses to forget must not wedge the login, and a session left
 * behind heals itself: the next request answers 401 and the base query clears it.
 */
export const clearAttempt = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts; clearSession: boolean } }) => {
    await input.ports.clearAttempt().catch(() => undefined);
    if (input.clearSession) {
      await input.ports.clearSession().catch(() => undefined);
      input.ports.forgetUser();
    }
  },
);
