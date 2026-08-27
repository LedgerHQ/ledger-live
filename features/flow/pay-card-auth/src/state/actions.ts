import { assign } from "xstate";
import type { CardLoginContext, CardLoginEvent } from "./types";

/**
 * The machine's named actions.
 *
 * Only an action that writes fixed values can live here. `setup()` types a named action with the whole
 * machine event union, so a named action cannot reach an actor answer. Every `assign` that reads
 * `event.output` stays inline at its transition, where XState narrows the event to that answer.
 */

const assignContext = assign<CardLoginContext, CardLoginEvent, undefined, CardLoginEvent, never>;

/** Everything an ended attempt leaves behind, except the error to show for it. */
export const forgetAttempt = assignContext({
  callback: null,
  loginUrl: null,
  session: null,
  clearSession: false,
  resumeAuthenticated: false,
});

export const clearErrorKind = assignContext({ errorKind: null });

export const failPkce = assignContext({ errorKind: "pkce_failed" });
