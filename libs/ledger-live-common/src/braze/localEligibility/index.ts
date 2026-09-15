/**
 * Local eligibility engine for Braze Content Cards.
 *
 * CRM sends broad campaigns; the app filters them client-side against the current
 * app state declared in `extras.requiredStates`. Braze cannot be the source of
 * truth (Segment→Braze sync is laggy and opted-out users have no reliable cohort
 * state), so eligibility is evaluated in-app after fetch, before Redux dispatch.
 *
 * The evaluator is pure and platform-agnostic: callers pass the card extras and a
 * boolean snapshot of the app state.
 */

import { isApprovedState } from "./states";
import type { EligibilityCard, EligibilityContext, EligibilityResult } from "./types";

export * from "./states";
export * from "./types";

const REQUIRED_STATES_SEPARATOR = ";";

/**
 * Parse the semicolon-separated `extras.requiredStates` field into raw state names.
 * Whitespace is trimmed and empty segments are dropped, so `"hasFunds; isOnboarded;"`
 * yields `["hasFunds", "isOnboarded"]`. Returns `[]` for missing or blank input.
 */
export const parseRequiredStates = (raw: string | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(REQUIRED_STATES_SEPARATOR)
    .map(state => state.trim())
    .filter(state => state.length > 0);
};

/**
 * Evaluate a Content Card against the current app state.
 *
 * A card with no `requiredStates` is always eligible. Otherwise every required state
 * must be an approved state AND satisfied by the context. The first state that fails
 * determines `blockedBy`, so evaluation is deterministic. An unknown state hides the
 * card (fail-safe) rather than rendering it to users who may not match.
 */
export const evaluateLocalEligibility = (
  card: EligibilityCard,
  context: EligibilityContext,
): EligibilityResult => {
  const requiredStates = parseRequiredStates(card.extras?.requiredStates);

  for (const state of requiredStates) {
    if (!isApprovedState(state)) {
      return { eligible: false, blockedBy: state, reason: "unknown-state" };
    }
    if (context[state] !== true) {
      return { eligible: false, blockedBy: state, reason: "unmet-state" };
    }
  }

  return { eligible: true };
};
