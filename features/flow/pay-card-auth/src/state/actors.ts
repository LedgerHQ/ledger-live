import type { PayCardSession } from "@domain/api-card-management";
import { fromPromise } from "xstate";
import { parseCallbackUrl } from "./callbackUrl";
import { MissingLoginStateError } from "./errors";
import type { PayCardLoginErrorKind } from "./errors";
import type {
  CardLoginInitiation,
  CardLoginOauthConfig,
  CardLoginPorts,
  PayCardAuthCallback,
} from "./types";

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

export const prepareAttempt = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts } }): Promise<CardLoginInitiation> => {
    const { state, codeVerifier, codeChallenge } = await input.ports.createAttempt();
    await input.ports.saveAttempt({ state, codeVerifier });

    // Only the public halves travel on. The verifier stays in the store until the token exchange.
    return { state, codeChallenge };
  },
);

export const initiateAuthorize = fromPromise(
  ({
    input,
  }: {
    input: {
      ports: CardLoginPorts;
      oauthConfig: CardLoginOauthConfig;
      initiation: CardLoginInitiation | null;
    };
  }) => {
    if (!input.initiation) {
      throw new MissingLoginStateError("attempt");
    }

    return input.ports.initiateAuthorize({
      clientId: input.oauthConfig.clientId,
      redirectUri: input.oauthConfig.redirectUri,
      state: input.initiation.state,
      codeChallenge: input.initiation.codeChallenge,
    });
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
    input: { ports: CardLoginPorts; loginUrl: string | null; deepLink: string };
  }) => {
    if (!input.loginUrl) {
      throw new MissingLoginStateError("URL");
    }

    const result = await input.ports.openHostedLogin(input.loginUrl, input.deepLink);

    return { callback: result.type === "success" ? parseCallbackUrl(result.url) : null };
  },
);

/** Compares the redirect against the attempt on disk. `kind` is null when they agree. */
export const validateCallback = fromPromise(
  async ({
    input,
  }: {
    input: { ports: CardLoginPorts; callback: PayCardAuthCallback | null };
  }): Promise<{ kind: PayCardLoginErrorKind | null }> => {
    const attempt = await input.ports.loadAttempt();
    if (!attempt || !input.callback) {
      return { kind: "missing_attempt" };
    }

    return { kind: attempt.state === input.callback.state ? null : "state_mismatch" };
  },
);

export const exchangeAuthorizationCode = fromPromise(
  async ({
    input,
  }: {
    input: { ports: CardLoginPorts; callback: PayCardAuthCallback | null; redirectUri: string };
  }) => {
    const attempt = await input.ports.loadAttempt();
    if (!attempt || !input.callback) {
      throw new MissingLoginStateError("attempt");
    }

    return input.ports.exchangeAuthorizationCode({
      code: input.callback.code,
      redirectUri: input.redirectUri,
      codeVerifier: attempt.codeVerifier,
    });
  },
);

export const persistSession = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts; session: PayCardSession | null } }) => {
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
    }
  },
);
