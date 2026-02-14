import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef, useMemo } from "react";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSettings } from "~/hooks";
import {
  analyticsEnabledSelector,
  counterValueCurrencySelector,
  exportSettingsSelector,
  hasSeenAnalyticsOptInPromptSelector,
  lastSeenDeviceSelector,
} from "~/reducers/settings";
import { DefaultAccountSwapParamList } from "../types";
import { useTranslateToSwapAccount } from "./hooks/useTranslateToSwapAccount";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useSwapCustomHandlers } from "./customHandlers";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import SafeAreaView from "~/components/SafeAreaView";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  manifest: LiveAppManifest;
  params: DefaultAccountSwapParamList | null;
  setWebviewState: (webviewState: WebviewState) => void;
};

export const WebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, params, setWebviewState }, ref) => {
    // Swap duplicated the Custom Handlers due to different needs compared to the rest of the platform apps,
    // to avoid complexifying the logic in the shared custom handlers.
    const accounts = useSelector(flattenAccountsSelector);
    const dispatch = useDispatch();
    const customSwapHandlers = useSwapCustomHandlers(manifest, accounts, dispatch);
    const customDeeplinkHandlers = useDeeplinkCustomHandlers();
    const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
      return {
        ...customSwapHandlers,
        ...customDeeplinkHandlers,
      };
    }, [customSwapHandlers, customDeeplinkHandlers]);
    const { theme } = useTheme();
    const { language } = useSettings();
    const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
    const countryLocale = getCountryLocale();
    const SWAP_API_BASE = useEnv("SWAP_API_BASE");
    const SWAP_USER_IP = useEnv("SWAP_USER_IP");
    const exportSettings = useSelector(exportSettingsSelector);

    const shareAnalytics = useSelector(analyticsEnabledSelector).toString();
    const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector).toString();

    const devMode = exportSettings.developerModeEnabled.toString();
    const lastSeenDevice = useSelector(lastSeenDeviceSelector);
    const swapParams = useTranslateToSwapAccount(params);
    const llmModularDrawerFF = useFeature("llmModularDrawer");

    const isLlmModularDrawer = llmModularDrawerFF?.enabled && llmModularDrawerFF?.params?.live_app;

    const { isEnabled: isLwm40Enabled } = useWalletFeaturesConfig("mobile");
    const insets = useSafeAreaInsets();

    // Capture the initial source to prevent webview refreshes.
    // currentRouteNameRef.current updates when going back and forth inside the navigation stack and returning to the webview
    const initialSource = useMemo(() => currentRouteNameRef.current || "", []);

    return (
      <SafeAreaView edges={["bottom"]} isFlex>
        <Web3AppWebview
          ref={ref}
          manifest={manifest}
          customHandlers={customHandlers}
          onStateChange={setWebviewState}
          inputs={{
            source: initialSource,
            swapApiBase: SWAP_API_BASE,
            swapUserIp: SWAP_USER_IP,
            devMode,
            theme,
            lang: language,
            locale: language, // LLM doesn't support different locales. By doing this we don't have to have specific LLM/LLD logic in earn, and in future if LLM supports locales we will change this from `language` to `locale`
            countryLocale,
            currencyTicker,
            lastSeenDevice: lastSeenDevice?.modelId,
            OS: Platform.OS,
            platform: "LLM", // need consistent format with LLD, Platform doesn't work
            shareAnalytics,
            hasSeenAnalyticsOptInPrompt,
            isModularDrawer: isLlmModularDrawer ? "true" : "false",
            lwm40enabled: isLwm40Enabled ? "true" : "false",
            safeAreaTop: insets.top.toString(),
            safeAreaBottom: insets.bottom.toString(),
            safeAreaLeft: insets.left.toString(),
            safeAreaRight: insets.right.toString(),
            ...swapParams,
          }}
        />
      </SafeAreaView>
    );
  },
);
