import { useIsSwapTab } from "./useIsSwapTab";
import { useCallback, useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import { WebviewAPI } from "~/components/Web3AppWebview/types";

export function useSwapAndroidHardwareBackPress({
  webviewRef,
  canGoBack,
}: {
  webviewRef: React.RefObject<WebviewAPI | null>;
  canGoBack: boolean;
}) {
  const { isSwapTabScreen } = useIsSwapTab();

  const customWebviewGoBack = useCallback(() => {
    if (canGoBack) {
      webviewRef?.current?.goBack();
      return true;
    }

    return false;
  }, [canGoBack, webviewRef]);

  useEffect(() => {
    if (Platform.OS === "android" && isSwapTabScreen) {
      const listener = BackHandler.addEventListener("hardwareBackPress", customWebviewGoBack);

      return () => {
        listener.remove();
      };
    }
  }, [isSwapTabScreen, customWebviewGoBack]);
}
