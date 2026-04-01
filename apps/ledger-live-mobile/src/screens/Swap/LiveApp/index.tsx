import React, { useCallback, useRef } from "react";

import { Flex } from "@ledgerhq/native-ui";
import Config from "react-native-config";
import InfiniteLoader from "~/components/InfiniteLoader";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewState } from "~/components/Web3AppWebview/types";
import { WebView } from "./WebView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { useSwapNavigationHelper } from "./navigationHandlers/useSwapNavigationHelper";
import { useSwapAndroidHardwareBackPress } from "./navigationHandlers/useSwapAndroidHardwareBackPress";
import { useSwapHeaderNavigation } from "./navigationHandlers/useSwapHeaderNavigation";
import TrackScreen from "~/analytics/TrackScreen";
import { useSwapLiveAppState } from "./hooks/useSwapLiveAppState";
import { sendSwapLiveAppReady } from "../../../../e2e/bridge/client";

export function SwapLiveApp({
  route,
}: StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapTab>) {
  const { params } = route;
  const navigation = useNavigation();

  const { manifest, error, isLoading, webviewRef, webviewState, setWebviewState, defaultParams } =
    useSwapLiveAppState(params);

  // Old-design-specific navigation hooks
  useSwapHeaderNavigation(webviewRef);

  useSwapAndroidHardwareBackPress({
    webviewRef,
    canGoBack: webviewState.canGoBack,
  });

  const onWebRouteChange = useSwapNavigationHelper({
    navigation,
  });

  const wasLoadingRef = useRef(false);

  const handleWebviewState = useCallback(
    (webviewState: WebviewState) => {
      onWebRouteChange({ url: webviewState.url, canGoBack: webviewState.canGoBack });

      if (Config.DETOX && wasLoadingRef.current && !webviewState.loading) {
        sendSwapLiveAppReady();
      }
      wasLoadingRef.current = webviewState.loading;

      setWebviewState(webviewState);
    },
    [onWebRouteChange, setWebviewState],
  );

  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="swap-form-tab">
      <TrackScreen name="Swap" />
      {manifest && (
        <WebView
          ref={webviewRef}
          manifest={manifest}
          setWebviewState={handleWebviewState}
          params={defaultParams}
        />
      )}
    </Flex>
  );
}
