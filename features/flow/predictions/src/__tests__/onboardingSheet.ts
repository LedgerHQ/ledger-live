import { act } from "react";
import type { PredictionsOnboardingStep, PredictionsSheet } from "@features/platform-predictions";
import { showPredictionsSheet } from "../predictionsSheetStore.internals";

export const INTRO_STEP: PredictionsOnboardingStep = { type: "intro" };
export const TERMS_STEP: PredictionsOnboardingStep = {
  type: "terms",
  versions: { termsVersion: "1", disclaimerVersion: "1" },
};
export const CONSENT_STEP: PredictionsOnboardingStep = {
  type: "consent",
  version: { disclosureVersion: "1" },
};

export function openOnboardingSheet(
  ...steps: [PredictionsOnboardingStep, ...PredictionsOnboardingStep[]]
) {
  const sheet = {
    steps,
    onStepAccept: jest.fn(),
    onComplete: jest.fn(),
  } satisfies PredictionsSheet;
  const onCancel = jest.fn();
  act(() => showPredictionsSheet(sheet, onCancel));
  return { ...sheet, onCancel };
}
