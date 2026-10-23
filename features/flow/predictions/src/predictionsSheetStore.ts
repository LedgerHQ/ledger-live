import { useEffect, useMemo, useRef } from "react";
import type { PredictionsSheet, PredictionsUiHooks } from "@features/platform-predictions";
import {
  dismissPredictionsSheet,
  dismissPredictionsSheetIfShown,
  showPredictionsSheet,
} from "./predictionsSheetStore.internals";

/**
 * The sheet half of `PredictionsUiHooks` for one live app player. Unmounting the player closes the
 * sheet it opened, but not one another player opened since.
 */
export function usePredictionsSheetHooks(): Pick<PredictionsUiHooks, "sheet.open" | "sheet.close"> {
  const openedSheetRef = useRef<PredictionsSheet | null>(null);

  useEffect(
    () => () => {
      if (openedSheetRef.current !== null) dismissPredictionsSheetIfShown(openedSheetRef.current);
    },
    [],
  );

  return useMemo(
    () => ({
      "sheet.open": (sheet, onCancel) => {
        openedSheetRef.current = sheet;
        showPredictionsSheet(sheet, onCancel);
      },
      "sheet.close": dismissPredictionsSheet,
    }),
    [],
  );
}
