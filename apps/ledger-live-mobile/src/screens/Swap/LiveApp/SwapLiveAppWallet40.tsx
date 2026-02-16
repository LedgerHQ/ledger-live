import React, { RefObject, useCallback, useMemo } from "react";
import { View } from "react-native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import GenericErrorView from "~/components/GenericErrorView";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import { useSwapLiveAppState } from "./hooks/useSwapLiveAppState";
import { useSwapWebviewProps } from "./hooks/useSwapWebviewProps";
import { DefaultAccountSwapParamList } from "../types";
import { useSwapWallet40HeaderStateUpdater } from "./navigationHandlers/wallet40/useSwapWallet40HeaderState";

type SwapWebviewContentProps = {
  manifest: LiveAppManifest;
  params: DefaultAccountSwapParamList | null;
  webviewRef: RefObject<WebviewAPI | null>;
  setWebviewState: (state: WebviewState) => void;
};

function SwapWebviewContent({
  manifest,
  params,
  webviewRef,
  setWebviewState,
}: Readonly<SwapWebviewContentProps>) {
  const { customHandlers, inputs } = useSwapWebviewProps({ manifest, params });

  return (
    <Web3AppWebview
      ref={webviewRef}
      manifest={manifest}
      customHandlers={customHandlers}
      onStateChange={setWebviewState}
      inputs={inputs}
    />
  );
}

/**
 * Wallet 4.0 variant of the Swap screen.
 */
export function SwapLiveAppWallet40({
  route,
}: Readonly<StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapTab>>) {
  const { params } = route;

  const { theme: lumenTheme } = useLumenTheme();

  const { manifest, error, isLoading, webviewRef, setWebviewState, defaultParams } =
    useSwapLiveAppState(params);

  const updateWallet40HeaderState = useSwapWallet40HeaderStateUpdater(webviewRef);

  const handleWebviewStateChange = useCallback(
    (nextState: WebviewState) => {
      setWebviewState(nextState);
      updateWallet40HeaderState(nextState);
    },
    [setWebviewState, updateWallet40HeaderState],
  );

  const containerStyle = useMemo(
    () => ({ flex: 1, backgroundColor: lumenTheme.colors.bg.base }),
    [lumenTheme.colors.bg.base],
  );

  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <View style={containerStyle}>
      {manifest && (
        <SwapWebviewContent
          manifest={manifest}
          params={defaultParams}
          webviewRef={webviewRef}
          setWebviewState={handleWebviewStateChange}
        />
      )}
    </View>
  );
}
