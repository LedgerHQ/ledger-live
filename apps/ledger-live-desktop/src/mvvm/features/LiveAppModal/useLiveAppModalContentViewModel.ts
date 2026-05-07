import { useEffect, useMemo } from "react";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  dismiss as dismissRequest,
  registerCloseHandler,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import { buildLiveAppModalURL } from "@ledgerhq/live-common/wallet-api/LiveAppModal/url";
import { handlers as liveAppModalHandlers } from "@ledgerhq/live-common/wallet-api/LiveAppModal/server";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { openURL } from "~/renderer/linking";
import { useSelector } from "LLD/hooks/redux";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import type { LiveAppModalParams } from "~/renderer/reducers/liveAppModal";

export type ExtraInputs = Record<string, string | undefined> | null;

export interface LiveAppModalContentViewModel {
  manifest: LiveAppManifest | undefined;
  inputs: Record<string, string | undefined>;
  customHandlers: WalletAPICustomHandlers;
  refreshManifests: () => void;
}

const useLiveAppModalContentViewModel = (
  params: LiveAppModalParams,
  onClose: () => void,
  extraInputs: ExtraInputs,
): LiveAppModalContentViewModel => {
  const { requestId, manifestId, path } = params;
  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest || remoteManifest;
  const { updateManifests } = useRemoteLiveAppContext();

  const themeType = useTheme().theme;
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countryLocale = getParsedSystemDeviceLocale().region;
  const discreetMode = useDiscreetMode();

  useEffect(() => {
    registerCloseHandler(requestId, onClose);
  }, [requestId, onClose]);

  useEffect(() => {
    // Safety net: if the component unmounts for any reason other than
    // onClose (e.g. Redux state cleared externally), make sure the
    // registry entry is resolved so the live-app's RPC promise settles.
    return () => {
      dismissRequest(requestId);
    };
  }, [requestId]);

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
        theme: themeType,
        lang: language,
        locale,
        countryLocale,
        currencyTicker: fiatCurrency.ticker,
        discreetMode: discreetMode ? "true" : "false",
        OS: "web",
        ...extraInputs,
      },
    });
  }, [
    manifest,
    path,
    requestId,
    themeType,
    language,
    locale,
    countryLocale,
    fiatCurrency.ticker,
    discreetMode,
    extraInputs,
  ]);

  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({
      ...liveAppModalHandlers({
        uiHooks: {
          // nested opens are rejected by the registry depth guard
          "custom.liveApp.modal.open": () => {
            /* no-op: nested modals not supported */
          },
        },
      }),
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": openParams => {
            if (openParams) openURL(openParams.url);
          },
        },
      }),
    }),
    [],
  );

  const inputs = useMemo<Record<string, string | undefined>>(
    () => ({
      theme: themeType,
      lang: language,
      locale,
      countryLocale,
      currencyTicker: fiatCurrency.ticker,
      discreetMode: discreetMode ? "true" : "false",
      OS: "web",
      isLiveAppModal: "true",
      liveAppModalRequestId: requestId,
      ...extraInputs,
      goToURL,
    }),
    [
      themeType,
      language,
      locale,
      countryLocale,
      fiatCurrency.ticker,
      discreetMode,
      requestId,
      extraInputs,
      goToURL,
    ],
  );

  return { manifest, inputs, customHandlers, refreshManifests: updateManifests };
};

export default useLiveAppModalContentViewModel;
