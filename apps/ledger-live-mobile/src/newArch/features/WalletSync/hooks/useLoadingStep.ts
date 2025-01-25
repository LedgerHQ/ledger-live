import { useEffect, useState } from "react";
import { useWalletSyncUserState } from "../components/WalletSyncContext";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/core";

export function useLoadingStep(created: boolean) {
  const [waitedWatchLoop, setWaitedWatchLoop] = useState(false);
  const { visualPending } = useWalletSyncUserState();
  const featureWalletSync = useFeature("llmWalletSync");
  const initialTimeout = featureWalletSync?.params?.watchConfig?.initialTimeout || 1000;
  const visualPendingTimeout = 1000;
  const navigation = useNavigation();

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setWaitedWatchLoop(true);
      },
      initialTimeout + visualPendingTimeout + 500,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [initialTimeout]);

  useEffect(() => {
    if (waitedWatchLoop && !visualPending) {
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncSuccess,
        params: {
          created,
        },
      });
    }
  }, [waitedWatchLoop, visualPending, navigation, created]);
}
