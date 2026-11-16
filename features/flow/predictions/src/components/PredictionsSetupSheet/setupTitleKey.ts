import type { PredictionsSetupOutcome } from "@features/platform-predictions";

type SetupTitleKey =
  | "predictions.binding.settingUp.title"
  | "predictions.binding.setupFailed.title"
  | "predictions.binding.setUp.created"
  | "predictions.binding.setUp.found";

export function setupTitleKey(outcome: PredictionsSetupOutcome | null): SetupTitleKey {
  if (outcome === null) return "predictions.binding.settingUp.title";
  switch (outcome.outcome) {
    case "failed":
      return "predictions.binding.setupFailed.title";
    case "created":
      return "predictions.binding.setUp.created";
    case "found":
      return "predictions.binding.setUp.found";
  }
}
