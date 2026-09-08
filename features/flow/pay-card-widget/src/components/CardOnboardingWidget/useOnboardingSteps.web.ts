import type { PayCardOnboardingStep } from "@domain/api-card-management";

export function useOnboardingSteps(
  steps: readonly PayCardOnboardingStep[],
): readonly PayCardOnboardingStep[] {
  return steps;
}
