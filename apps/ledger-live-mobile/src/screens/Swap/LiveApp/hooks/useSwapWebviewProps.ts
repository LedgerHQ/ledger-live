import { useMemo } from "react";
import { Platform } from "react-native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSettings } from "~/hooks";
import {
  analyticsEnabledSelector,
  counterValueCurrencySelector,
  exportSettingsSelector,
  hasSeenAnalyticsOptInPromptSelector,
  lastSeenDeviceSelector,
} from "~/reducers/settings";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useSwapCustomHandlers } from "../customHandlers";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { useTranslateToSwapAccount } from "./useTranslateToSwapAccount";
import { DefaultAccountSwapParamList } from "../../types";

type UseSwapWebviewPropsParams = {
  manifest: LiveAppManifest;
  params: DefaultAccountSwapParamList | null;
};

/**
 * Shared hook encapsulating swap webview props:
 * - Custom handlers (swap + deeplink)
 * - Webview inputs (theme, language, env vars, swap params, etc.)
 */
export function useSwapWebviewProps({ manifest, params }: UseSwapWebviewPropsParams) {
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

  const inputs = useMemo(
    () => ({
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
      platform: "LLM" as const, // need consistent format with LLD, Platform doesn't work
      shareAnalytics,
      hasSeenAnalyticsOptInPrompt,
      isModularDrawer: isLlmModularDrawer ? "true" : "false",
      lwm40enabled: isLwm40Enabled ? "true" : "false",
      safeAreaTop: insets.top.toString(),
      safeAreaBottom: insets.bottom.toString(),
      safeAreaLeft: insets.left.toString(),
      safeAreaRight: insets.right.toString(),
      ...swapParams,
    }),
    [
      initialSource,
      SWAP_API_BASE,
      SWAP_USER_IP,
      devMode,
      theme,
      language,
      countryLocale,
      currencyTicker,
      lastSeenDevice?.modelId,
      shareAnalytics,
      hasSeenAnalyticsOptInPrompt,
      isLlmModularDrawer,
      isLwm40Enabled,
      insets.top,
      insets.bottom,
      insets.left,
      insets.right,
      swapParams,
    ],
  );

  return {
    customHandlers,
    inputs,
  };
}
