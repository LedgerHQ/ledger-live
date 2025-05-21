import { useCallback, useEffect } from "react";
import WebView, { WebViewNavigation } from "react-native-webview";
import { SwapWebviewAllowedPageNames } from "./types";
import { NavigationProp, NavigationState, ParamListBase } from "@react-navigation/native";
import { BackHandler, Platform } from "react-native";
import { useIsSwapTab } from "~/screens/Swap/LiveApp/useIsSwapTab";

type NavigationType = Omit<NavigationProp<ParamListBase>, "getState"> & {
  getState(): NavigationState | undefined;
};

export function useSwapNavigationHelper({ navigation }: { navigation: NavigationType }) {
  const { isSwapTabScreen } = useIsSwapTab();

  return useCallback(
    (event: WebViewNavigation) => {
      if (isSwapTabScreen) {
        const url = new URL(event.url);
        const tabParam = url.searchParams.get("tab");

        let page: SwapWebviewAllowedPageNames =
          tabParam === "QUOTES_LIST"
            ? SwapWebviewAllowedPageNames.QuotesList
            : SwapWebviewAllowedPageNames.AccountSelection;

        let canGoBack = event.canGoBack;

        if (event.url.includes("two-step-approval")) {
          page = SwapWebviewAllowedPageNames.TwoStepApproval;
        }

        if (event.url.includes("unknown-error")) {
          page = SwapWebviewAllowedPageNames.UnknownError;
          canGoBack = false;
        }

        navigation.setParams({ swapNavigationParams: { tab: tabParam, page: page, canGoBack } });
      }
    },
    [isSwapTabScreen, navigation],
  );
}

export function useSwapAndroidHardwareBackPress({
  webviewRef,
  canGoBack,
}: {
  webviewRef: React.RefObject<WebView>;
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
      BackHandler.addEventListener("hardwareBackPress", customWebviewGoBack);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", customWebviewGoBack);
      };
    }
  }, [isSwapTabScreen, customWebviewGoBack]);
}
