import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useSelector } from "~/context/hooks";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import { INTERNAL_APP_IDS } from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { safeUrl } from "@ledgerhq/live-common/wallet-api/helpers";

import storage from "LLM/storage";
import { useNavigation } from "@react-navigation/native";

import SafeAreaView from "~/components/SafeAreaView";

import { flattenAccountsSelector } from "~/reducers/accounts";
import { WebviewAPI, WebviewState } from "../Web3AppWebview/types";
import { Web3AppWebview } from "../Web3AppWebview";
import { RootNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { ScreenName } from "~/const";
import { Loading } from "../Loading";
import { usePTXCustomHandlers } from "./CustomHandlers";
import { useDeeplinkCustomHandlers } from "../WebPlatformPlayer/CustomHandlers";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { BackConfig, BackToInternalDomain } from "./BackToLwButton";
import { handleBackToLwEntryPoint } from "./handleBackToLwEntryPoint";

export type { BackConfig } from "./BackToLwButton";

export type InterstitialType = React.ComponentType<{
  manifest: LiveAppManifest;
  isLoading: boolean;
  description?: string;
}>;

export const WebPTXPlayer = ({
  manifest,
  inputs,
  disableHeader,
  config = {
    screen: ScreenName.ExchangeSell,
    btnText: manifest.name,
  },
  softExit = false,
  Interstitial,
}: {
  manifest: LiveAppManifest;
  inputs?: Record<string, string | undefined>;
  disableHeader?: boolean;
  config?: BackConfig;
  softExit?: boolean;
  Interstitial?: InterstitialType;
}) => {
  const lastMatchingURL = useRef<string | null>(null);
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

  const isInternalApp = useMemo(() => {
    if (!internalAppIds.includes(manifest.id)) {
      return false;
    }

    if (!lastMatchingURL || !webviewState.url) {
      return true;
    }

    const manifestHostname = new URL(manifest.url).hostname;
    const currentHostname = new URL(webviewState.url).hostname;

    return manifestHostname === currentHostname;
  }, [internalAppIds, manifest.id, manifest.url, webviewState.url]);

  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  useEffect(() => {
    (async () => {
      if (isInternalApp && webviewState.url) {
        const url = safeUrl(webviewState.url);

        if (url) {
          const goToURL = url.searchParams.get("goToURL") || "";
          const manifestId = url.searchParams.get("goToManifest");

          if (manifestId && goToURL) {
            const searchParams = url.searchParams;
            const flowName = searchParams.get("flowName") || "";
            const lastScreen = searchParams.get("lastScreen") || flowName;

            await Promise.all([
              storage.saveString("manifest-id", manifestId),
              storage.saveString("flow-name", flowName),
              storage.saveString("last-screen", lastScreen),
            ]);

            handleBackToLwEntryPoint(navigation, config.screen, {
              platform: manifestId,
              goToURL,
            });

            return void 0;
          }
        }
      }

      if (isInternalApp && lastMatchingURL) {
        lastMatchingURL.current = webviewState.url;
      }
    })();
  }, [config.screen, isInternalApp, navigation, webviewState.url]);

  const handleHardwareBackPress = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    if (webviewState.canGoBack) {
      webview.goBack();
      return true; // prevent default behavior (native navigation)
    }

    return false;
  }, [webviewState.canGoBack, webviewAPIRef]);

  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleHardwareBackPress,
      );

      return () => {
        subscription.remove();
      };
    }
  }, [handleHardwareBackPress]);

  useEffect(() => {
    const handler = (e: { preventDefault: () => void }) => {
      const webviewAPI = safeGetRefValue(webviewAPIRef);
      if (webviewState.canGoBack) {
        webviewAPI.goBack();
        e.preventDefault();
      }
    };
    navigation.addListener("beforeRemove", handler);

    return () => {
      navigation.removeListener("beforeRemove", handler);
    };
  }, [webviewState.canGoBack, navigation]);

  useEffect(() => {
    if (!disableHeader) {
      navigation.setOptions({
        headerRight: () => null,
        headerLeft: () => (isInternalApp ? null : <BackToInternalDomain config={config} />),
        headerTitle: () => null,
        title: "",
        headerShown: !isInternalApp,
      });
    }
  }, [config, disableHeader, isInternalApp, manifest, navigation, webviewState?.url, softExit]);

  const accounts = useSelector(flattenAccountsSelector);
  const customPTXHandlers = usePTXCustomHandlers(manifest, accounts);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...customPTXHandlers,
      ...customDeeplinkHandlers,
    };
  }, [customPTXHandlers, customDeeplinkHandlers]);
  return (
    <SafeAreaView edges={isInternalApp ? ["left", "right", "top"] : ["left", "right"]} isFlex>
      <Web3AppWebview
        ref={webviewAPIRef}
        manifest={manifest}
        inputs={inputs}
        onStateChange={setWebviewState}
        customHandlers={customHandlers}
        Loader={PTXLoader}
      />
      {Interstitial && <Interstitial manifest={manifest} isLoading={webviewState.loading} />}
    </SafeAreaView>
  );
};

const PTXLoader = () => {
  return <Loading />;
};
