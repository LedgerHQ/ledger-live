import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { handlers as predictionsHandlers } from "@features/platform-predictions";
import { useStore } from "~/context/hooks";
import {
  hasSeenPredictionsIntroSelector,
  markPredictionsIntroSeen,
} from "@domain/entity-predictions";
import { usePredictionsSheetHooks } from "@features/flow-predictions";

export function usePredictionsHandlers(): WalletAPICustomHandlers {
  const navigation = useNavigation();
  const store = useStore();
  const sheetHooks = usePredictionsSheetHooks();

  return useMemo<WalletAPICustomHandlers>(
    () =>
      predictionsHandlers({
        uiHooks: {
          ...sheetHooks,
          "app.close": () => navigation.goBack(),
          "intro.isSeen": () => hasSeenPredictionsIntroSelector(store.getState().predictions),
          "intro.markSeen": () => store.dispatch(markPredictionsIntroSeen()),
        },
      }),
    [navigation, sheetHooks, store],
  );
}
