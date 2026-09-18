import type { EligibilityState } from "./states";

/**
 * Snapshot of the current app state, one boolean per approved state key. The
 * platform integrations (mobile PR-13 / desktop PR-14) build this from their own
 * selectors; the engine stays pure and platform-agnostic by only reading booleans.
 */
export type EligibilityContext = Partial<Record<EligibilityState, boolean>>;

/** Minimal Content Card shape the evaluator needs. Braze extras are always strings. */
export type EligibilityCard = {
  extras?: Record<string, string>;
};

/** Why a card was hidden — the debug signal consumed by the Settings debug panel. */
export type EligibilityBlockReason =
  // `requiredStates` names a state that is not in the approved allowlist (typo / retired state).
  | "unknown-state"
  // An approved state the current app state does not satisfy.
  | "unmet-state";

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; blockedBy: string; reason: EligibilityBlockReason };
