import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
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
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  enablePlatformDevToolsSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useBorrowLiveConfig } from "LLD/features/Borrow/hooks/useBorrowLiveConfig";

type BorrowLocationState = { returnTo?: string };

export type BorrowWebviewInputs = {
  devMode: string;
  theme: string;
  lang: string;
  locale: string;
  countryLocale: string;
  currencyTicker: string;
  OS: string;
  platform: "LLD";
  discreetMode: string;
};

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_BORROW_MANIFEST_ID ||
  DEFAULT_FEATURES.ptxBorrowLiveApp?.params?.manifest_id ||
  "borrow";

export function useBorrowAppViewModel() {
  const borrowFlag = useBorrowLiveConfig();
  const manifestId = borrowFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(manifestId || undefined);
  const remoteManifest = useRemoteLiveAppManifest(manifestId || undefined);
  const manifest = localManifest || remoteManifest;

  const { updateManifests } = useRemoteLiveAppContext();

  const { theme } = useTheme();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const lang = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const devMode = useSelector(developerModeSelector);
  const discreetMode = useDiscreetMode();
  const countryLocale = getParsedSystemDeviceLocale().region;
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as BorrowLocationState | null;
  // Persist initial returnTo in a ref so it survives in-webview navigations that push
  // new React Router locations and overwrite location.state.
  const returnToRef = useRef<string | null>(null);
  useEffect(() => {
    const value = locationState?.returnTo;
    if (returnToRef.current === null && value != null && value !== "") {
      returnToRef.current = value;
    }
  }, [locationState?.returnTo]);
  const returnTo = returnToRef.current ?? locationState?.returnTo ?? "/";

  const onBack = useCallback(() => {
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const onStateChange = (state: WebviewState) => {
    setWebviewState(state);
  };

  const inputs = useMemo<BorrowWebviewInputs>(
    () => ({
      devMode: devMode.toString(),
      theme,
      lang,
      locale,
      countryLocale,
      currencyTicker: fiatCurrency.ticker,
      OS: "web",
      platform: "LLD",
      discreetMode: discreetMode ? "true" : "false",
    }),
    [countryLocale, devMode, discreetMode, fiatCurrency.ticker, lang, locale, theme],
  );

  return {
    manifest,
    refreshManifests: updateManifests,
    inputs,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
    onBack,
  };
}
