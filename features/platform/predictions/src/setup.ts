/** Why the provider couldn't set up the trading wallet, as the live app reports it. */
export const PREDICTIONS_SETUP_FAILURE_REASONS = [
  "failed-deploy",
  "failed-permission",
  "timeout",
  "unavailable",
  "unknown",
] as const;

export type PredictionsSetupFailureReason = (typeof PREDICTIONS_SETUP_FAILURE_REASONS)[number];

export type PredictionsSetupOutcome =
  | { outcome: "created" }
  | { outcome: "found" }
  | { outcome: "failed"; reason: PredictionsSetupFailureReason };
