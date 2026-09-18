/**
 * Approved `requiredStates` allowlist.
 *
 * Every value CRM may put in `extras.requiredStates` must be listed here. Adding a
 * new state also means wiring its data source in the platform integrations (mobile
 * PR-13 / desktop PR-14). Unknown values are rejected by the evaluator, so a typo
 * hides the card instead of rendering it to the wrong users.
 */

export const APPROVED_STATES = ["hasFunds", "isOnboarded", "hasStax"] as const;

/** A state name CRM is allowed to require, e.g. "hasFunds". */
export type EligibilityState = (typeof APPROVED_STATES)[number];

const APPROVED_STATE_SET: ReadonlySet<string> = new Set(APPROVED_STATES);

export const isApprovedState = (value: string): value is EligibilityState =>
  APPROVED_STATE_SET.has(value);
