import { useEffect, useMemo, useRef } from "react";
import type { PredictionsUiHooks } from "@features/platform-predictions";
import {
  dismissPredictionsSetupIfShown,
  reportPredictionsSetup,
  startPredictionsSetup,
} from "./predictionsSetupStore.internals";

/**
 * Per player: reports only reach the setup this player started, and unmounting closes only that
 * one.
 */
export function usePredictionsSetupHooks(): Pick<PredictionsUiHooks, "binding.reportSetup"> & {
  startSetup: () => void;
} {
  const setupIdRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (setupIdRef.current !== null) dismissPredictionsSetupIfShown(setupIdRef.current);
    },
    [],
  );

  return useMemo(
    () => ({
      startSetup: () => {
        setupIdRef.current = startPredictionsSetup();
      },
      "binding.reportSetup": outcome =>
        setupIdRef.current === null
          ? Promise.resolve()
          : reportPredictionsSetup(setupIdRef.current, outcome),
    }),
    [],
  );
}
