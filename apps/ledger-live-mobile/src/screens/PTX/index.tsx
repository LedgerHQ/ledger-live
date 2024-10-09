import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import semver from "semver";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "~/analytics/TrackScreen";
import GenericErrorView from "~/components/GenericErrorView";
import { WebPTXPlayer } from "~/components/WebPTXPlayer";
import { PtxNavigatorParamList } from "~/components/RootNavigator/types/PtxNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName, NavigatorName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { useInternalAppIds } from "@ledgerhq/live-common/hooks/useInternalAppIds";
import { INTERNAL_APP_IDS, WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";
import { walletSelector } from "~/reducers/wallet";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";

export type Props = StackNavigatorProps<
  PtxNavigatorParamList,
  ScreenName.ExchangeBuy | ScreenName.ExchangeSell | ScreenName.Card
> & {
  config?:
    | {
        screen: ScreenName.ExchangeBuy | ScreenName.ExchangeSell;
        navigator: NavigatorName.Exchange;
        btnText: string;
      }
    | {
        screen: ScreenName.Card;
        navigator: NavigatorName.Card;
        btnText: string;
      };
};

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

export function PtxScreen({ route, config }: Props) {
  const accounts = useSelector(accountsSelector);
  const devMode = useEnv("MANAGER_DEV_MODE").toString();
  const { theme } = useTheme();
  const { platform, ...params } = route.params || {};
  const searchParams = route.path
    ? new URL("ledgerlive://" + route.path).searchParams
    : new URLSearchParams();
  const localManifest = useLocalLiveAppManifest(platform);
  const remoteManifest = useRemoteLiveAppManifest(platform);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { language, locale } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const manifest = localManifest || remoteManifest;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;
  const walletState = useSelector(walletSelector);

  /**
   * Pass correct account ID
   * Due to Platform SDK account ID not being equivalent to Wallet API account ID
   */
  const customParams = useMemo(() => {
    if (
      "account" in params &&
      params?.account &&
      manifest?.apiVersion &&
      semver.satisfies(WALLET_API_VERSION, manifest.apiVersion)
    ) {
      const { account: accountId } = params;
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        const parentAccount = isTokenAccount(account)
          ? getParentAccount(account, accounts)
          : undefined;
        params.account = accountToWalletAPIAccount(walletState, account, parentAccount).id;
      }
    }
    return params;
  }, [walletState, accounts, manifest?.apiVersion, params]);

  /**
   * Given the user is on an internal app (webview url is owned by LL) we must reset the session
   * to ensure the context is reset. last-screen is used to give an external app's webview context
   * of the last screen the user was on before navigating to the external app screen.
   */
  useEffect(
    () => {
      (async () => {
        if (manifest?.id && internalAppIds.includes(manifest.id)) {
          await AsyncStorage.removeItem("last-screen");
          await AsyncStorage.removeItem("manifest-id");
          await AsyncStorage.removeItem("flow-name");
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return manifest ? (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPTXPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: language,
          locale,
          currencyTicker,
          devMode,
          ...(localManifest?.providerTestBaseUrl && {
            providerTestBaseUrl: localManifest?.providerTestBaseUrl,
          }),
          ...customParams,
          ...Object.fromEntries(searchParams.entries()),
        }}
        config={config}
      />
    </>
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={appManifestNotFoundError} />
      )}
    </Flex>
  );
}
