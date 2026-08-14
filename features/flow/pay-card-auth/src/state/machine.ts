import type { PayCardSession } from "@domain/api-card-management";
import { assign, fromPromise, setup } from "xstate";
import { parseCallbackUrl } from "./callbackUrl";
import { isUnauthorizedError, MissingLoginStateError } from "./errors";
import type { PayCardLoginErrorKind } from "./errors";
import type { CardLoginPorts } from "./ports";
import type { CardLoginOauthConfig, PayCardAuthCallback } from "./types";

export type CardLoginMachineInput = {
  readonly ports: CardLoginPorts;
  readonly oauthConfig: CardLoginOauthConfig;
  /** A redirect the app already held when the screen mounted, from a cold start on the deep link. */
  readonly callback?: PayCardAuthCallback | null;
};

/**
 * The machine's working memory. No secret is kept here as a source of truth: the PKCE verifier lives
 * in the flow's store and the session lives in platform-card. `session` holds the freshly exchanged
 * tokens for the one step between the exchange and the disk write, and is dropped again straight
 * after.
 */
type CardLoginContext = {
  ports: CardLoginPorts;
  oauthConfig: CardLoginOauthConfig;
  callback: PayCardAuthCallback | null;
  /** The public halves of the current attempt: the CSRF state and the PKCE challenge. */
  initiation: { state: string; codeChallenge: string } | null;
  loginUrl: string | null;
  session: PayCardSession | null;
  errorKind: PayCardLoginErrorKind | null;
  /** Set when the session on disk turned out to be dead, so the wipe takes it as well. */
  clearSession: boolean;
  /** Set when the wipe is only hygiene and a valid session is waiting behind it. */
  resumeAuthenticated: boolean;
};

type CardLoginEvent =
  | { type: "LOGIN" }
  | { type: "RETRY" }
  | { type: "CALLBACK_RECEIVED"; code: string; state: string };

/** Reads whether a login attempt and a session are on disk. No writes: see `clearingAttempt`. */
const hydrate = fromPromise(async ({ input }: { input: { ports: CardLoginPorts } }) => {
  const [attempt, hasSession] = await Promise.all([
    input.ports.loadAttempt(),
    input.ports.hasSession(),
  ]);

  return { hasAttempt: attempt !== null, hasSession };
});

const prepareAttempt = fromPromise(async ({ input }: { input: { ports: CardLoginPorts } }) => {
  const { state, codeVerifier, codeChallenge } = await input.ports.createAttempt();
  await input.ports.saveAttempt({ state, codeVerifier });

  // Only the public halves travel on. The verifier stays in the store until the token exchange.
  return { state, codeChallenge };
});

const initiateAuthorize = fromPromise(
  ({
    input,
  }: {
    input: {
      ports: CardLoginPorts;
      oauthConfig: CardLoginOauthConfig;
      initiation: CardLoginContext["initiation"];
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
const openHostedLogin = fromPromise(
  async ({
    input,
  }: {
    input: { ports: CardLoginPorts; loginUrl: string | null; redirectUri: string };
  }) => {
    if (!input.loginUrl) {
      throw new MissingLoginStateError("URL");
    }

    const result = await input.ports.openHostedLogin(input.loginUrl, input.redirectUri);

    return { callback: result.type === "success" ? parseCallbackUrl(result.url) : null };
  },
);

/** Compares the redirect against the attempt on disk. `kind` is null when they agree. */
const validateCallback = fromPromise(
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

const exchangeAuthorizationCode = fromPromise(
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

const persistSession = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts; session: PayCardSession | null } }) => {
    if (!input.session) {
      throw new MissingLoginStateError("session");
    }

    await input.ports.persistSession(input.session);
    await input.ports.clearAttempt();
  },
);

const getUser = fromPromise(({ input }: { input: { ports: CardLoginPorts } }) =>
  input.ports.getUser(),
);

/**
 * Best effort by design. A store that refuses to forget must not wedge the login, and a session left
 * behind heals itself: the next request answers 401 and the base query clears it.
 */
const clearAttempt = fromPromise(
  async ({ input }: { input: { ports: CardLoginPorts; clearSession: boolean } }) => {
    await input.ports.clearAttempt().catch(() => undefined);
    if (input.clearSession) {
      await input.ports.clearSession().catch(() => undefined);
    }
  },
);

export const cardLoginMachine = setup({
  types: {
    context: {} as CardLoginContext,
    events: {} as CardLoginEvent,
    input: {} as CardLoginMachineInput,
  },
  actors: {
    hydrate,
    prepareAttempt,
    initiateAuthorize,
    openHostedLogin,
    validateCallback,
    exchangeAuthorizationCode,
    persistSession,
    getUser,
    clearAttempt,
  },
  guards: {
    hasErrorKind: ({ context }) => context.errorKind !== null,
    shouldResumeAuthenticated: ({ context }) => context.resumeAuthenticated,
  },
  actions: {
    /** Everything an ended attempt leaves behind, except the error to show for it. */
    forgetAttempt: assign({
      callback: null,
      initiation: null,
      loginUrl: null,
      session: null,
      clearSession: false,
      resumeAuthenticated: false,
    }),
    clearErrorKind: assign({ errorKind: null }),
  },
}).createMachine({
  id: "cardLogin",
  context: ({ input }) => ({
    ports: input.ports,
    oauthConfig: input.oauthConfig,
    callback: input.callback ?? null,
    initiation: null,
    loginUrl: null,
    session: null,
    errorKind: null,
    clearSession: false,
    resumeAuthenticated: false,
  }),
  initial: "hydrating",
  states: {
    hydrating: {
      invoke: {
        src: "hydrate",
        input: ({ context }) => ({ ports: context.ports }),
        onDone: [
          {
            guard: ({ context, event }) => context.callback !== null && event.output.hasAttempt,
            target: "validatingCallback",
          },
          {
            // A session plus a leftover attempt: wipe the attempt, then carry on signed in.
            guard: ({ event }) => event.output.hasSession && event.output.hasAttempt,
            target: "clearingAttempt",
            actions: assign({ resumeAuthenticated: true }),
          },
          { guard: ({ event }) => event.output.hasSession, target: "authenticated" },
          // A redirect with no attempt behind it. `validatingCallback` names that failure.
          { guard: ({ context }) => context.callback !== null, target: "validatingCallback" },
          { guard: ({ event }) => event.output.hasAttempt, target: "clearingAttempt" },
          { target: "idle" },
        ],
        // A store we cannot read holds nothing we can use. The user can still start a login.
        onError: { target: "idle" },
      },
      on: {
        // Remembered, not acted on: the hydrate answer decides where this goes, so a redirect that
        // arrives one render after mount can never overtake the disk read.
        CALLBACK_RECEIVED: {
          actions: assign({
            callback: ({ event }) => ({ code: event.code, state: event.state }),
          }),
        },
      },
    },

    idle: {
      entry: ["forgetAttempt", "clearErrorKind"],
      on: { LOGIN: { target: "preparingAttempt" } },
    },

    preparingAttempt: {
      entry: ["forgetAttempt", "clearErrorKind"],
      invoke: {
        src: "prepareAttempt",
        input: ({ context }) => ({ ports: context.ports }),
        onDone: {
          target: "initiatingAuthorize",
          actions: assign({ initiation: ({ event }) => event.output }),
        },
        // Nothing reached the store, so there is nothing to wipe.
        onError: { target: "error", actions: assign({ errorKind: "pkce_failed" }) },
      },
    },

    initiatingAuthorize: {
      invoke: {
        src: "initiateAuthorize",
        input: ({ context }) => ({
          ports: context.ports,
          oauthConfig: context.oauthConfig,
          initiation: context.initiation,
        }),
        onDone: {
          target: "awaitingHostedLogin",
          actions: assign({ loginUrl: ({ event }) => event.output.url }),
        },
        onError: {
          target: "clearingAttempt",
          actions: assign({ errorKind: "initiate_failed" }),
        },
      },
    },

    awaitingHostedLogin: {
      exit: assign({ loginUrl: null }),
      invoke: {
        src: "openHostedLogin",
        input: ({ context }) => ({
          ports: context.ports,
          loginUrl: context.loginUrl,
          redirectUri: context.oauthConfig.redirectUri,
        }),
        onDone: [
          {
            guard: ({ event }) => event.output.callback !== null,
            target: "validatingCallback",
            actions: assign({ callback: ({ event }) => event.output.callback }),
          },
          // Dismissed. The user left on purpose, so no message follows them back.
          { target: "clearingAttempt" },
        ],
        onError: {
          target: "clearingAttempt",
          actions: assign({ errorKind: "browser_open_failed" }),
        },
      },
      on: {
        // The app forwarded the deep link before the browser reported it. First one wins.
        CALLBACK_RECEIVED: {
          target: "validatingCallback",
          actions: assign({
            callback: ({ event }) => ({ code: event.code, state: event.state }),
          }),
        },
      },
    },

    validatingCallback: {
      invoke: {
        src: "validateCallback",
        input: ({ context }) => ({ ports: context.ports, callback: context.callback }),
        onDone: [
          { guard: ({ event }) => event.output.kind === null, target: "exchangingCode" },
          {
            target: "clearingAttempt",
            actions: assign({ errorKind: ({ event }) => event.output.kind }),
          },
        ],
        onError: {
          target: "clearingAttempt",
          actions: assign({ errorKind: "missing_attempt" }),
        },
      },
    },

    exchangingCode: {
      invoke: {
        src: "exchangeAuthorizationCode",
        input: ({ context }) => ({
          ports: context.ports,
          callback: context.callback,
          redirectUri: context.oauthConfig.redirectUri,
        }),
        onDone: {
          target: "persistingSession",
          actions: assign({ session: ({ event }) => event.output }),
        },
        onError: {
          target: "clearingAttempt",
          actions: assign({ errorKind: "exchange_failed" }),
        },
      },
    },

    persistingSession: {
      invoke: {
        src: "persistSession",
        input: ({ context }) => ({ ports: context.ports, session: context.session }),
        onDone: { target: "authenticated", actions: assign({ session: null }) },
        onError: {
          target: "clearingAttempt",
          actions: assign({ errorKind: "persist_failed", session: null }),
        },
      },
    },

    authenticated: {
      always: { target: "fetchingUser" },
    },

    fetchingUser: {
      invoke: {
        src: "getUser",
        input: ({ context }) => ({ ports: context.ports }),
        onDone: { target: "ready" },
        onError: [
          {
            // The session is finished, not stale: the base query already tried to renew it.
            guard: ({ event }) => isUnauthorizedError(event.error),
            target: "clearingAttempt",
            actions: assign({ clearSession: true }),
          },
          // Network or backend trouble. The session stays, so a retry does not force a new login.
          { target: "error", actions: assign({ errorKind: "fetch_user_failed" }) },
        ],
      },
    },

    clearingAttempt: {
      invoke: {
        src: "clearAttempt",
        input: ({ context }) => ({ ports: context.ports, clearSession: context.clearSession }),
        onDone: [
          { guard: "hasErrorKind", target: "error" },
          { guard: "shouldResumeAuthenticated", target: "authenticated" },
          { target: "idle" },
        ],
      },
    },

    error: {
      entry: "forgetAttempt",
      on: {
        LOGIN: { target: "preparingAttempt" },
        RETRY: { target: "preparingAttempt" },
      },
    },

    // Terminal for v1. Logout and renewal are later work (LIVE-34741).
    ready: {},
  },
});
