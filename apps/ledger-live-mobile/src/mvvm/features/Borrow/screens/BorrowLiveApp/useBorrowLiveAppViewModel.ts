import { useCallback, useMemo, useRef, useState } from "react";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
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
import { counterValueCurrencySelector, exportSettingsSelector } from "~/reducers/settings";
import { useBorrowLiveConfig } from "LLM/features/Borrow/hooks/useBorrowLiveConfig";
import type { RefObject } from "react";

export type BorrowWebviewInputs = {
  devMode: string;
  theme: string;
  lang: string;
  locale: string;
  countryLocale: string;
  currencyTicker: string;
  OS: string;
  platform: "LLM";
};

type BorrowLiveAppViewModel = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewState: WebviewState;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: BorrowWebviewInputs;
};

const DEFAULT_MANIFEST_ID =
  FEATURE_FLAGS_DEFAULTS.ptxBorrowLiveApp?.params?.manifest_id ?? "borrow";

export function useBorrowLiveAppViewModel(): BorrowLiveAppViewModel {
  const { t } = useTranslation();
  const borrowConfig = useBorrowLiveConfig();
  const { isConnected } = useNetInfo();
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const exportSettings = useSelector(exportSettingsSelector);

  const webviewRef = useRef<WebviewAPI>(null);
  const countryLocale = getCountryLocale();

  const borrowManifestId = borrowConfig?.params?.manifest_id ?? DEFAULT_MANIFEST_ID;

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(
    borrowManifestId || undefined,
  );
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(
    borrowManifestId || undefined,
  );
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest = useMemo<LiveAppManifest | undefined>(
    () => localManifest ?? remoteManifest,
    [localManifest, remoteManifest],
  );

  const onWebviewStateChange = useCallback((state: WebviewState) => {
    setWebviewState(state);
  }, []);

  const webviewInputs = useMemo<BorrowWebviewInputs>(
    () => ({
      devMode: exportSettings.developerModeEnabled.toString(),
      theme,
      lang: language,
      locale: language,
      countryLocale,
      currencyTicker,
      OS: Platform.OS,
      platform: "LLM",
    }),
    [currencyTicker, countryLocale, exportSettings.developerModeEnabled, language, theme],
  );

  const error: Error | null = useMemo(() => {
    const hasError = !manifest || isConnected === false;
    if (!hasError) return null;

    if (isConnected === false) {
      return new Error(t("errors.WebPTXPlayerNetworkFail.title"));
    }
    if (!manifest) {
      return new Error(t("errors.AppManifestUnknownError.title"));
    }

    return null;
  }, [manifest, isConnected, t]);

  return {
    manifest,
    error,
    isLoading: remoteLiveAppState.isLoading,
    webviewState,
    webviewRef,
    onWebviewStateChange,
    webviewInputs,
  };
}
