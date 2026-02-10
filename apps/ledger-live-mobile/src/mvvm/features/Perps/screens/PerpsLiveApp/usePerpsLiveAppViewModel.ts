import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/defaultFeatures";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useNetInfo } from "@react-native-community/netinfo";
import { Platform } from "react-native";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
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
import { currentRouteNameRef } from "~/analytics/screenRefs";
import { usePerpsLiveConfig } from "LLM/features/Perps/hooks/usePerpsLiveConfig";

export type PerpsWebviewInputs = {
  source: string;
  devMode: string;
  theme: string;
  lang: string;
  locale: string;
  countryLocale: string;
  currencyTicker: string;
  lastSeenDevice?: string;
  OS: string;
  platform: "LLM";
  shareAnalytics: string;
  hasSeenAnalyticsOptInPrompt: string;
};

type PerpsLiveAppViewModel = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: PerpsWebviewInputs;
};

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_PERPS_MANIFEST_ID ||
  DEFAULT_FEATURES.ptxPerpsLiveAppMobile.params?.manifest_id;

export function usePerpsLiveAppViewModel(): PerpsLiveAppViewModel {
  const { t } = useTranslation();
  const ptxPerpsLiveAppMobile = usePerpsLiveConfig();
  const { isConnected } = useNetInfo();
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const exportSettings = useSelector(exportSettingsSelector);
  const shareAnalytics = useSelector(analyticsEnabledSelector).toString();
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector).toString();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const webviewRef = useRef<WebviewAPI>(null);
  const countryLocale = getCountryLocale();

  const perpsLiveAppManifestID = ptxPerpsLiveAppMobile?.params?.manifest_id ?? DEFAULT_MANIFEST_ID;

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(
    perpsLiveAppManifestID || undefined,
  );
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(
    perpsLiveAppManifestID || undefined,
  );
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest = useMemo<LiveAppManifest | undefined>(
    () => (!localManifest ? remoteManifest : localManifest),
    [localManifest, remoteManifest],
  );

  const onWebviewStateChange = useCallback((state: WebviewState) => {
    setWebviewState(state);
  }, []);

  // Capture the initial source to prevent webview refreshes.
  // currentRouteNameRef.current updates when going back and forth inside the navigation stack and returning to the webview
  const initialSource = useMemo(() => currentRouteNameRef.current || "", []);

  const webviewInputs = useMemo<PerpsWebviewInputs>(
    () => ({
      source: initialSource,
      devMode: exportSettings.developerModeEnabled.toString(),
      theme,
      lang: language,
      locale: language, // LLM doesn't support different locales. Keep aligned with LLM conventions
      countryLocale,
      currencyTicker,
      lastSeenDevice: lastSeenDevice?.modelId,
      OS: Platform.OS,
      platform: "LLM", // need consistent format with LLD, Platform doesn't work
      shareAnalytics,
      hasSeenAnalyticsOptInPrompt,
    }),
    [
      currencyTicker,
      countryLocale,
      exportSettings.developerModeEnabled,
      hasSeenAnalyticsOptInPrompt,
      initialSource,
      language,
      lastSeenDevice?.modelId,
      shareAnalytics,
      theme,
    ],
  );

  const isWebviewError = webviewState?.url.includes("/unknown-error");

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

    return null;
  }, [manifest, isWebviewError, isConnected, t]);

  return {
    manifest,
    error,
    isLoading: remoteLiveAppState.isLoading,
    webviewRef,
    onWebviewStateChange,
    webviewInputs,
  };
}
