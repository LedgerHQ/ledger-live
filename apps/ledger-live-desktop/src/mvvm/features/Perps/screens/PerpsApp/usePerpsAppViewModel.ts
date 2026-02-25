import { useMemo, useRef, useState } from "react";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useSelector } from "LLD/hooks/redux";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  enablePlatformDevToolsSelector,
  hasSeenAnalyticsOptInPromptSelector,
  languageSelector,
  lastSeenDeviceSelector,
  shareAnalyticsSelector,
} from "~/renderer/reducers/settings";
import { usePerpsLiveConfig } from "LLD/features/Perps/hooks/usePerpsLiveConfig";

export type PerpsWebviewInputs = {
  source: string;
  theme: string;
  lang: string;
  currencyTicker: string;
  devMode: string;
  lastSeenDevice?: string;
  currentVersion: string;
  platform: "LLD";
  shareAnalytics: string;
  hasSeenAnalyticsOptInPrompt: string;
  discreetMode: string;
};

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_PERPS_MANIFEST_ID || DEFAULT_FEATURES.ptxPerpsLiveApp.params?.manifest_id;

export function usePerpsAppViewModel() {
  const perpsLiveEnabledFlag = usePerpsLiveConfig();
  const manifestId = perpsLiveEnabledFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(manifestId || undefined);
  const remoteManifest = useRemoteLiveAppManifest(manifestId || undefined);
  const manifest = localManifest || remoteManifest;

  const { updateManifests } = useRemoteLiveAppContext();

  const { theme } = useTheme();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector).toString();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const devMode = useSelector(developerModeSelector);
  const discreetMode = useDiscreetMode();

  const onStateChange = (state: WebviewState) => {
    setWebviewState(state);
  };

  const initialSource = useMemo(() => currentRouteNameRef.current || "", []);

  const inputs = useMemo<PerpsWebviewInputs>(
    () => ({
      source: initialSource,
      theme,
      lang: locale,
      currencyTicker: fiatCurrency.ticker,
      devMode: devMode.toString(),
      lastSeenDevice: lastSeenDevice?.modelId,
      currentVersion: __APP_VERSION__,
      platform: "LLD",
      shareAnalytics: shareAnalytics.toString(),
      hasSeenAnalyticsOptInPrompt,
      discreetMode: discreetMode ? "true" : "false",
    }),
    [
      devMode,
      discreetMode,
      fiatCurrency.ticker,
      hasSeenAnalyticsOptInPrompt,
      initialSource,
      lastSeenDevice?.modelId,
      locale,
      shareAnalytics,
      theme,
    ],
  );

  return {
    manifest,
    refreshManifests: updateManifests,
    inputs,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
  };
}
