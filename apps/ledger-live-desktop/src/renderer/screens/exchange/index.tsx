import React, { useMemo } from "react";
import semver from "semver";
import { RouteComponentProps, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Card from "~/renderer/components/Box/Card";
import {
  counterValueCurrencySelector,
  developerModeSelector,
  languageSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
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
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useDiscreetMode } from "~/renderer/components/Discreet";

type ExchangeState = { account?: string } | undefined;

const LiveAppExchange = ({ appId }: { appId: string }) => {
  const { state: urlParams, search } = useLocation<ExchangeState>();
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
  const themeType = useTheme().colors.palette.type;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;
  const walletState = useSelector(walletSelector);

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

  return (
    <Card
      grow
      style={{
        overflow: "hidden",
        height: "100%",
      }}
    >
      {manifest ? (
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
        />
      ) : null}
    </Card>
  );
};

export type ExchangeComponentParams = {
  appId?: string;
};

const Exchange = ({ match }: RouteComponentProps<ExchangeComponentParams>) => {
  const appId = match?.params?.appId;
  const buySellUiFlag = useFeature("buySellUi");
  const defaultPlatform = buySellUiFlag?.params?.manifestId || BUY_SELL_UI_APP_ID;

  return <LiveAppExchange appId={appId || defaultPlatform} />;
};
export default Exchange;
