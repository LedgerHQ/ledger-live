import type { PredictionsSetupOutcome } from "@features/platform-predictions";
import { createPendingResultStore, type ShownResult } from "./pendingResultStore.internals";

/** What the setup dialog shows. `key` changes with every request and outcome. */
export type ShownSetup = ShownResult<PredictionsSetupOutcome>;

const setupStore = createPendingResultStore<PredictionsSetupOutcome, void>({
  dismissedAnswer: undefined,
});

export const startPredictionsSetup = setupStore.start;
export const reportPredictionsSetup = setupStore.report;
export const markPredictionsSetupPresented = setupStore.markPresented;
/** Also lets whoever waits for the setup go on. */
export const dismissPredictionsSetup = setupStore.dismiss;
export const dismissPredictionsSetupIfShown = setupStore.dismissIfShown;

export function usePredictionsSetup(): Readonly<{
  isOpen: boolean;
  shownSetup: ShownSetup | null;
}> {
  const { isOpen, shownResult } = setupStore.useShownResult();
  return { isOpen, shownSetup: shownResult };
}
