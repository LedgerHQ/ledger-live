import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Linking, Platform } from "react-native";
import { useTheme } from "styled-components/native";
import { useFocusEffect } from "@react-navigation/native";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { registerCloseHandler } from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import { buildLiveAppModalURL } from "@ledgerhq/live-common/wallet-api/LiveAppModal/url";
import { handlers as liveAppModalHandlers } from "@ledgerhq/live-common/wallet-api/LiveAppModal/server";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useSelector } from "~/context/hooks";
import { useSettings } from "~/hooks";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import type { LiveAppModalParams } from "~/reducers/liveAppModal";

export type ExtraInputs = Record<string, string | undefined> | null;

export interface LiveAppModalContentViewModel {
  manifest: LiveAppManifest | null | undefined;
  isManifestLoading: boolean;
  inputs: Record<string, string | undefined>;
  customHandlers: WalletAPICustomHandlers;
  webviewAPIRef: React.RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
}

const useLiveAppModalContentViewModel = (
  params: LiveAppModalParams,
  onClose: () => void,
  extraInputs: ExtraInputs,
): LiveAppModalContentViewModel => {
  const { requestId, manifestId, path } = params;
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const countryLocale = getCountryLocale();

  const manifest = useLiveAppManifest(manifestId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  useEffect(() => {
    registerCloseHandler(requestId, onClose);
  }, [requestId, onClose]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (webviewState.canGoBack) {
          webviewAPIRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [webviewState.canGoBack]),
  );

  // The Earn middleware reads initialization state from the URL (theme, lang,
  // uiVersion, etc.) because getInitialURL passes goToURL through as-is
  // without merging our `inputs` prop.
  const goToURL = useMemo(() => {
    if (!manifest) return undefined;
    return buildLiveAppModalURL({
      manifestURL: manifest.url.toString(),
      path,
      requestId,
      inputs: {
        theme,
        lang: language,
        locale: language,
        countryLocale,
        currencyTicker,
        discreetMode: discreet ? "true" : "false",
        OS: Platform.OS,
        ...extraInputs,
      },
    });
  }, [
    manifest,
    path,
    requestId,
    theme,
    language,
    countryLocale,
    currencyTicker,
    discreet,
    extraInputs,
  ]);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...liveAppModalHandlers({
        uiHooks: {
          // nested opens from within a modal are rejected by the registry's depth guard,
          // but we still need to satisfy the handler contract
          "custom.liveApp.modal.open": () => {
            /* no-op: nested opens not supported */
          },
        },
      }),
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": openParams => {
            if (openParams) Linking.openURL(openParams.url);
          },
        },
      }),
    };
  }, []);

  const inputs = useMemo<Record<string, string | undefined>>(
    () => ({
      theme,
      lang: language,
      locale: language,
      isLiveAppModal: "true",
      liveAppModalRequestId: requestId,
      goToURL,
    }),
    [theme, language, requestId, goToURL],
  );

  return {
    manifest,
    isManifestLoading: remoteLiveAppState.isLoading,
    inputs,
    customHandlers,
    webviewAPIRef,
    onWebviewStateChange: setWebviewState,
  };
};

export default useLiveAppModalContentViewModel;
