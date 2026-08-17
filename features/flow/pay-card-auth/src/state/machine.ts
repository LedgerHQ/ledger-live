import { assign, setup } from "xstate";
import {
  clearAttempt,
  exchangeAuthorizationCode,
  getUser,
  hydrate,
  initiateAuthorize,
  openHostedLogin,
  persistSession,
  prepareAttempt,
  validateCallback,
} from "./actors";
import { isUnauthorizedError } from "./errors";
import type { CardLoginContext, CardLoginEvent, CardLoginMachineInput } from "./types";

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
      // The resume is spent. Left set, a later 401 would send `clearingAttempt` back here instead of to
      // `idle`, and the machine would loop between the two while the session was already gone.
      entry: assign({ resumeAuthenticated: false }),
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
