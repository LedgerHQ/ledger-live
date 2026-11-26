import { useEffect } from "react";
import { useLedgerSyncLoadingSettled } from "@features/platform-ledger-sync";
import { useFeature } from "@features/platform-feature-flags";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/core";

export function useLoadingStep(created: boolean) {
  const featureWalletSync = useFeature("llmWalletSync");
  const isSettled = useLedgerSyncLoadingSettled(
    featureWalletSync?.params?.watchConfig?.initialTimeout,
  );
  const navigation = useNavigation();

  useEffect(() => {
    if (isSettled) {
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncSuccess,
        params: {
          created,
        },
      });
    }
  }, [isSettled, navigation, created]);
}
