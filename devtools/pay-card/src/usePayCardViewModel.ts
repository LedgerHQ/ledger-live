import { useCallback, useMemo } from "react";
import type { OnboardingStep, PayCardToolProps } from "./types";

/** Turn a step id into a human label: "kyc-check" -> "Kyc check". */
export function formatId(id: string): string {
  const spaced = id.replace(/[-_]+/g, " ").trim();
  if (spaced.length === 0) return id;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export interface PayCardViewModel {
  /** The onboarding steps, in order. */
  readonly steps: readonly OnboardingStep[];
  /** How many steps are currently marked done. */
  readonly completedCount: number;
  /** Total number of steps. */
  readonly totalCount: number;
  /** Whether every step is marked done. */
  readonly allDone: boolean;
  /** Flip a single step's done state. */
  readonly toggleStep: (id: string) => void;
  /** Mark every step done (true) or not-done (false) at once. */
  readonly setAllSteps: (done: boolean) => void;
}

/**
 * Shared, platform-neutral view model for the Card / Pay DevTool.
 *
 * Derives the onboarding progress and exposes helpers to toggle steps.
 * Rendered identically by the web and native views.
 */
export function usePayCardViewModel(props: PayCardToolProps): PayCardViewModel {
  const { onboarding } = props;
  const { steps, setStepDone } = onboarding;

  const completedCount = useMemo(() => steps.filter(step => step.done).length, [steps]);
  const totalCount = steps.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const toggleStep = useCallback(
    (id: string) => {
      const step = steps.find(candidate => candidate.id === id);
      if (step !== undefined) setStepDone(id, !step.done);
    },
    [steps, setStepDone],
  );

  const setAllSteps = useCallback(
    (done: boolean) => {
      for (const step of steps) {
        if (step.done !== done) setStepDone(step.id, done);
      }
    },
    [steps, setStepDone],
  );

  return { steps, completedCount, totalCount, allDone, toggleStep, setAllSteps };
}
