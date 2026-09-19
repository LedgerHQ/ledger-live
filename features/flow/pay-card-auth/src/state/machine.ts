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
import { clearErrorKind, failPkce, forgetAttempt, publishProviderAppId } from "./actions";
import { isStaleRequestError, isUnauthorizedError } from "./errors";
import { hasErrorKind, shouldResumeAuthenticated } from "./guards";
import type { CardLoginContext, CardLoginEvent, CardLoginMachineInput } from "./types";

function isRedirectForCurrentAttempt(
  redirectState: string | undefined,
  attemptState: string | null,
): boolean {
  return redirectState === undefined || redirectState === attemptState;
}

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
    publishProviderAppId,
    /**
     * `More` is a separate component with no machine, so it cannot read this snapshot. These two
     * publish the answer it needs through a port, on entry, which keeps the flag and the state in step.
     */
    publishSignedIn: ({ context }) => context.ports.setSignedIn(true),
    publishSignedOut: ({ context }) => context.ports.setSignedIn(false),
    /**
     * Only a code exchange reaches this, so a resumed session never raises the flag. It runs in the
     * transition, not in an effect: `ready` signs the holder in, which unmounts CardLogin at once.
     */
    markIntroSeen: ({ context }) => context.ports.markIntroSeen(),
  },
}).createMachine({
  id: "cardLogin",
  context: ({ input }) => ({
    ports: input.ports,
    oauthConfig: input.oauthConfig,
    callback: input.callback ?? null,
    loginUrl: null,
    attemptState: null,
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
            callback: ({ event }) => ({ code: event.code, appId: event.appId }),
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
          actions: assign({
            loginUrl: ({ event }) => event.output.loginUrl,
            attemptState: ({ event }) => event.output.state,
          }),
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
            // Same rule as the deep link below, when the source can answer it: a redirect that
            // carries a `state` for another attempt is not the one this invoke opened. A source that
            // cannot supply `state` at all still gets through on its `code` alone.
            guard: ({ context, event }) =>
              event.output.callback !== null &&
              isRedirectForCurrentAttempt(event.output.callback.state, context.attemptState),
            target: "validatingCallback",
            actions: assign({ callback: ({ event }) => event.output.callback }),
          },
          // The attempt has to outlive this step: the deep link carries the redirect in its own time.
          { guard: ({ event }) => event.output.isPending, target: "awaitingCallback" },
          // Dismissed. The user left on purpose, so no message follows them back.
          { target: "clearingAttempt" },
        ],
        onError: {
          target: "clearingAttempt",
          actions: assign({ errorKind: "browser_open_failed" }),
        },
      },
      on: {
        // The app forwarded the deep link before the browser reported it. First one wins. A stray
        // redirect from an attempt already abandoned answers `state` for a different attempt, so it
        // fails the guard and is dropped: this invoke keeps waiting on its own attempt undisturbed.
        CALLBACK_RECEIVED: {
          guard: ({ context, event }) =>
            isRedirectForCurrentAttempt(event.state, context.attemptState),
          target: "validatingCallback",
          actions: assign({
            callback: ({ event }) => ({ code: event.code, appId: event.appId }),
          }),
        },
      },
    },

    awaitingCallback: {
      on: {
        // Same guard, same reason: the redirect this state is waiting on is the one whose `state`
        // matches the attempt that is still current, not one left over from an attempt retried away.
        CALLBACK_RECEIVED: {
          guard: ({ context, event }) =>
            isRedirectForCurrentAttempt(event.state, context.attemptState),
          target: "validatingCallback",
          actions: assign({
            callback: ({ event }) => ({ code: event.code, appId: event.appId }),
          }),
        },
        // The redirect may never arrive, so a second press mints a fresh attempt instead of wedging.
        LOGIN: { target: "preparingAttempt" },
      },
    },

    validatingCallback: {
      invoke: {
        src: "validateCallback",
        input: ({ context }) => ({ ports: context.ports, callback: context.callback }),
        onDone: [
          {
            guard: ({ event }) => event.output.kind === null,
            target: "exchangingCode",
            // On the transition, not on entry: a transition action runs before the target state
            // spawns its actor, so the exchange itself already carries the tenant.
            actions: "publishProviderAppId",
          },
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
      entry: "markIntroSeen",
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
          {
            guard: ({ event }) => isStaleRequestError(event.error),
            target: "idle",
          },
          // Network or backend trouble. The session stays, so a retry does not force a new login.
          { target: "userFetchError", actions: assign({ errorKind: "fetch_user_failed" }) },
        ],
      },
    },

    clearingAttempt: {
      invoke: {
        src: "clearAttempt",
        input: ({ context }) => ({ ports: context.ports, clearSession: context.clearSession }),
        onDone: [
          { guard: "hasErrorKind", target: "authError" },
          { guard: "shouldResumeAuthenticated", target: "authenticated" },
          { target: "idle" },
        ],
      },
    },

    authError: {
      entry: ["forgetAttempt", "publishSignedOut"],
      on: {
        RETRY: { target: "idle" },
        DISMISS: { target: "idle" },
      },
    },

    userFetchError: {
      entry: "forgetAttempt",
      on: {
        LOGIN: { target: "preparingAttempt" },
        RETRY: { target: "fetchingUser", actions: "clearErrorKind" },
        DISMISS: { target: "idle" },
      },
    },

    ready: {
      entry: "publishSignedIn",
      // `More` ended the session, and it owns that whole journey. Nothing is left to undo here,
      // so this only puts the login back on offer.
      on: { SESSION_ENDED: { target: "idle" } },
    },
  },
});
