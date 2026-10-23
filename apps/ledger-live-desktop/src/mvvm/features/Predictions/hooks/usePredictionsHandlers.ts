import { handlers as predictionsHandlers } from "@features/platform-predictions";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useMemo } from "react";
import { useStore } from "LLD/hooks/redux";
import {
  hasSeenPredictionsIntroSelector,
  markPredictionsIntroSeen,
} from "@domain/entity-predictions";
import { usePredictionsSheetHooks } from "@features/flow-predictions";

export function usePredictionsHandlers(onClose?: () => void) {
  const store = useStore();
  const sheetHooks = usePredictionsSheetHooks();

  return useMemo<WalletAPICustomHandlers>(
    () =>
      predictionsHandlers({
        uiHooks: {
          ...sheetHooks,
          "app.close": () => onClose?.(),
          "intro.isSeen": () => hasSeenPredictionsIntroSelector(store.getState().predictions),
          "intro.markSeen": () => store.dispatch(markPredictionsIntroSeen()),
        },
      }),
    [onClose, sheetHooks, store],
  );
}
