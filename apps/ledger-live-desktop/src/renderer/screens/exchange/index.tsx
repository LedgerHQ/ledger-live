import React, { useMemo } from "react";
import semver from "semver";
import { useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import Card from "~/renderer/components/Box/Card";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import useTheme from "~/renderer/hooks/useTheme";
import WebPTXPlayer from "~/renderer/components/WebPTXPlayer";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import {
  BUY_SELL_UI_APP_ID,
  INTERNAL_APP_IDS,
  WALLET_API_VERSION,
} from "@ledgerhq/live-common/wallet-api/constants";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useProviderInterstitalEnabled } from "@ledgerhq/live-common/hooks/useShowProviderLoadingTransition";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { ProviderInterstitial } from "LLD/components/ProviderInterstitial";
import PageHeader from "LLD/components/PageHeader";
import { getWallet40HeaderKey } from "./helpers";

type ExchangeState = { account?: string } | undefined;

const LiveAppExchange = ({ appId }: { appId: string }) => {
  const location = useLocation();
  const urlParams = location.state as ExchangeState;
  const { search } = location;
  const searchParams = new URLSearchParams(search);
  const lang = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const devMode = useSelector(developerModeSelector);
  const accounts = useSelector(accountsSelector);
  const discreetMode = useDiscreetMode();

  const mockManifest: LiveAppManifest | undefined =
    process.env.MOCK_REMOTE_LIVE_MANIFEST && JSON.parse(process.env.MOCK_REMOTE_LIVE_MANIFEST)[0];

  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const manifest = localManifest || mockManifest || remoteManifest;
  const themeType = useTheme().theme;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;
  const walletState = useSelector(walletSelector);

  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("desktop");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const providerInterstitialEnabled = useProviderInterstitalEnabled({
    manifest,
  });

  /**
   * Pass correct account ID
   * Due to Platform SDK account ID not being equivalent to Wallet API account ID
   */
  const customUrlParams = useMemo(() => {
    if (
      urlParams?.account &&
      manifest?.apiVersion &&
      semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)
    ) {
      const { account: accountId } = urlParams;
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        const parentAccount = isTokenAccount(account)
          ? getParentAccount(account, accounts)
          : undefined;
        urlParams.account = accountToWalletAPIAccount(walletState, account, parentAccount).id;
      }
    }
    return urlParams;
  }, [accounts, manifest?.apiVersion, urlParams, walletState]);

  const { updateManifests } = useRemoteLiveAppContext();

  if (!manifest) {
    return <NetworkErrorScreen refresh={updateManifests} type="warning" />;
  }

  /**
   * Given the user is on an internal app (webview url is owned by LL) we must reset the session
   * to ensure the context is reset. last-screen is used to give an external app's webview context
   * of the last screen the user was on before navigating to the external app screen.
   */
  if (manifest?.id && internalAppIds.includes(manifest.id)) {
    const { localStorage } = window;
    localStorage.removeItem("last-screen");
    localStorage.removeItem("manifest-id");
    localStorage.removeItem("flow-name");
  }

  const headerKey = getWallet40HeaderKey(manifest.id);
  return (
    <>
      {shouldDisplayWallet40MainNav && headerKey ? (
        <PageHeader title={t(headerKey)} onBack={() => navigate(-1)} />
      ) : null}
      <Card
        grow
        style={{
          overflow: "hidden",
          height: "100%",
        }}
      >
        <WebPTXPlayer
          manifest={manifest}
          inputs={{
            theme: themeType,
            ...customUrlParams,
            lang,
            locale,
            currencyTicker,
            devMode,
            discreetMode: discreetMode ? "true" : "false",
            ...(localManifest?.providerTestBaseUrl && {
              providerTestBaseUrl: localManifest?.providerTestBaseUrl,
            }),
            ...(localManifest?.providerTestId && {
              providerTestId: localManifest?.providerTestId,
            }),

            ...Object.fromEntries(searchParams.entries()),
          }}
          Loader={providerInterstitialEnabled ? ProviderInterstitial : undefined}
        />
      </Card>
    </>
  );
};

export type ExchangeComponentParams = {
  appId?: string;
};

const Exchange = () => {
  const { appId } = useParams<ExchangeComponentParams>();
  const buySellUiFlag = useFeature("buySellUi");
  const defaultPlatform = buySellUiFlag?.params?.manifestId || BUY_SELL_UI_APP_ID;

  return <LiveAppExchange appId={appId || defaultPlatform} />;
};
export default Exchange;
