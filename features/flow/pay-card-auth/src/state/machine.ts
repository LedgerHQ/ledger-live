import { assign, setup } from "xstate";
import {
  clearAttempt,
  exchangeAuthorizationCode,
  getUser,
  hydrate,
  openHostedLogin,
  persistSession,
  prepareAttempt,
  validateCallback,
} from "./actors";
import { clearErrorKind, failPkce, forgetAttempt } from "./actions";
import { isUnauthorizedError } from "./errors";
import { hasErrorKind, shouldResumeAuthenticated } from "./guards";
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
    openHostedLogin,
    validateCallback,
    exchangeAuthorizationCode,
    persistSession,
    getUser,
    clearAttempt,
  },
  guards: {
    hasErrorKind,
    shouldResumeAuthenticated,
  },
  actions: {
    forgetAttempt,
    clearErrorKind,
    failPkce,
    /**
     * `CardMore` is a separate component with no machine, so it cannot read this snapshot. These two
     * publish the answer it needs through a port, on entry, which keeps the flag and the state in step.
     */
    publishSignedIn: ({ context }) => context.ports.setSignedIn(true),
    publishSignedOut: ({ context }) => context.ports.setSignedIn(false),
  },
}).createMachine({
  id: "cardLogin",
  context: ({ input }) => ({
    ports: input.ports,
    oauthConfig: input.oauthConfig,
    callback: input.callback ?? null,
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
            callback: ({ event }) => ({ code: event.code }),
          }),
        },
      },
    },

    idle: {
      entry: ["forgetAttempt", "clearErrorKind", "publishSignedOut"],
      on: { LOGIN: { target: "preparingAttempt" } },
    },

    preparingAttempt: {
      entry: ["forgetAttempt", "clearErrorKind"],
      invoke: {
        src: "prepareAttempt",
        input: ({ context }) => ({ ports: context.ports, oauthConfig: context.oauthConfig }),
        onDone: {
          // The provider hosts the authorize page, so the actor builds the URL and nothing is asked
          // of the backend first. One step fewer, and one fewer way for a login to fail.
          target: "awaitingHostedLogin",
          actions: assign({ loginUrl: ({ event }) => event.output.loginUrl }),
        },
        // The attempt may already be stored, because the URL is built after the write. `clearingAttempt`
        // wipes it and then reads the error kind, which sends this to `error`.
        onError: { target: "clearingAttempt", actions: "failPkce" },
      },
    },

    awaitingHostedLogin: {
      exit: assign({ loginUrl: null }),
      invoke: {
        src: "openHostedLogin",
        input: ({ context }) => ({
          ports: context.ports,
          loginUrl: context.loginUrl,
          deepLink: context.oauthConfig.deepLink,
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
            callback: ({ event }) => ({ code: event.code }),
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
      entry: ["forgetAttempt", "publishSignedOut"],
      on: {
        LOGIN: { target: "preparingAttempt" },
        RETRY: { target: "preparingAttempt" },
      },
    },

    ready: {
      entry: "publishSignedIn",
      // `CardMore` ended the session, and it owns that whole journey. Nothing is left to undo here,
      // so this only puts the login back on offer.
      on: { SESSION_ENDED: { target: "idle" } },
    },
  },
});
