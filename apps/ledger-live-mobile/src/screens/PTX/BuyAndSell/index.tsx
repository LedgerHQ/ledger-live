import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import semver from "semver";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "~/analytics/TrackScreen";
import GenericErrorView from "~/components/GenericErrorView";
import { useLocale } from "~/context/Locale";
import { WebPTXPlayer } from "~/components/WebPTXPlayer";
import { ExchangeNavigatorParamList } from "~/components/RootNavigator/types/ExchangeNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import { INTERNAL_APP_IDS, WALLET_API_VERSION } from "@ledgerhq/live-common/wallet-api/constants";

export type Props = StackNavigatorProps<
  ExchangeNavigatorParamList,
  ScreenName.ExchangeBuy | ScreenName.ExchangeSell
>;

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

export function BuyAndSellScreen({ route }: Props) {
  const accounts = useSelector(accountsSelector);
  const { theme } = useTheme();
  const { platform, ...params } = route.params || {};
  const searchParams = route.path
    ? new URL("ledgerlive://" + route.path).searchParams
    : new URLSearchParams();
  const localManifest = useLocalLiveAppManifest(platform);
  const remoteManifest = useRemoteLiveAppManifest(platform);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();
  const manifest = localManifest || remoteManifest;

  /**
   * Pass correct account ID
   * Due to Platform SDK account ID not being equivalent to Wallet API account ID
   */
  const customParams = useMemo(() => {
    if (
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
        params.account = accountToWalletAPIAccount(account, parentAccount).id;
      }
    }
    return params;
  }, [accounts, manifest?.apiVersion, params]);

  /**
   * Given the user is on an internal app (webview url is owned by LL) we must reset the session
   * to ensure the context is reset. last-screen is used to give an external app's webview context
   * of the last screen the user was on before navigating to the external app screen.
   */
  useEffect(
    () => {
      (async () => {
        if (manifest?.id && INTERNAL_APP_IDS.includes(manifest.id)) {
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
          lang: locale,
          ...customParams,
          ...Object.fromEntries(searchParams.entries()),
        }}
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
