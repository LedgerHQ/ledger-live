import React, { useCallback, useMemo, useRef, useState } from "react";

import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/defaultFeatures";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import GenericErrorView from "~/components/GenericErrorView";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { WebView } from "./WebView";
import { DefaultAccountSwapParamList } from "../types";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import { useNetInfo } from "@react-native-community/netinfo";
import { useSwapNavigationHelper } from "./navigationHandlers/useSwapNavigationHelper";
import { useNavigation } from "@react-navigation/native";
import { useSwapAndroidHardwareBackPress } from "./navigationHandlers/useSwapAndroidHardwareBackPress";
import { useSwapHeaderNavigation } from "./navigationHandlers/useSwapHeaderNavigation";

// set the default manifest ID for the production swap live app
// in case the FF is failing to load the manifest ID
// "swap-live-app-demo-3" points to production vercel URL for the swap live app
const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || DEFAULT_FEATURES.ptxSwapLiveApp.params?.manifest_id;

const isDefaultAccountSwapParamsList = (
  params: DefaultAccountSwapParamList | unknown,
): params is DefaultAccountSwapParamList =>
  params != null &&
  typeof params === "object" &&
  (("defaultAccount" in params && params.defaultAccount !== undefined) ||
    ("defaultCurrency" in params && params.defaultCurrency !== undefined) ||
    ("currency" in params && params.currency !== undefined) ||
    ("affiliate" in params && params.affiliate !== undefined));

export function SwapLiveApp({
  route,
}: StackNavigatorProps<SwapNavigatorParamList, ScreenName.SwapTab>) {
  const { params } = route;
  const { t } = useTranslation();
  const ptxSwapLiveAppMobile = useFeature("ptxSwapLiveAppMobile");
  const { isConnected } = useNetInfo();
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const isWebviewError = webviewState?.url.includes("/unknown-error");

  const webviewRef = useRef<WebviewAPI>(null);
  const navigation = useNavigation();

  const swapLiveAppManifestID = ptxSwapLiveAppMobile?.params?.manifest_id ?? DEFAULT_MANIFEST_ID;

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(
    swapLiveAppManifestID || undefined,
  );
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(
    swapLiveAppManifestID || undefined,
  );
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest = useMemo<LiveAppManifest | undefined>(
    () => (!localManifest ? remoteManifest : localManifest),
    [localManifest, remoteManifest],
  );
  const defaultParams = useMemo(() => {
    const isValid = isDefaultAccountSwapParamsList(params);
    const result = isValid ? params : null;
    return result;
  }, [params]);

  useSwapHeaderNavigation(webviewRef);

  useSwapAndroidHardwareBackPress({
    webviewRef,
    canGoBack: webviewState.canGoBack,
  });

  const onWebRouteChange = useSwapNavigationHelper({
    navigation,
  });

  const handleWebviewState = useCallback(
    (webviewState: WebviewState) => {
      onWebRouteChange({ url: webviewState.url, canGoBack: webviewState.canGoBack });

      setWebviewState(webviewState);
    },
    [onWebRouteChange],
  );

  const error: Error | null = useMemo(() => {
    const hasError = !manifest || isWebviewError || !isConnected;
    if (!hasError) return null;

    const APP_FAILED_TO_LOAD = new Error(t("errors.AppManifestNotFoundError.title"));
    const APP_MANIFEST_NOT_FOUND_ERROR = new Error(t("errors.AppManifestUnknownError.title"));
    const APP_MANIFEST_NETWORK_DOWN_ERROR = new Error(t("errors.WebPTXPlayerNetworkFail.title"));

    // in QAA isConnected remains null and is crashing the tests
    if (isConnected === false) return APP_MANIFEST_NETWORK_DOWN_ERROR;
    if (isWebviewError) return APP_FAILED_TO_LOAD;
    if (!manifest) return APP_MANIFEST_NOT_FOUND_ERROR;

    return error;
  }, [manifest, isWebviewError, isConnected, t]);

  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {remoteLiveAppState.isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="swap-form-tab">
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
