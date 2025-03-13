import { useCallback, useContext, useMemo } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import {
  liveAppContext as remoteLiveAppContext,
  // LiveAppRegistry,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppRegistry } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/types";
import { liveAppContext as localLiveAppProviderContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest, Loadable } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getAccountCurrency, isAccountEmpty } from "@ledgerhq/coin-framework/lib/account/helpers";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { NavigatorName, ScreenName } from "~/const";
import { EntryOf } from "~/types/helpers";
import { NavigationParamsType } from "~/components/FabActions";

import { useAnalytics } from "~/analytics";

import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigationProp } from "@react-navigation/stack";

import { WalletState } from "@ledgerhq/live-wallet/store";

const getRemoteLiveAppManifestById = (
  appId: string,
  liveAppRegistry: Loadable<LiveAppRegistry>,
) => {
  if (!liveAppRegistry.value || !appId) {
    return undefined;
  }

  return (
    liveAppRegistry.value.liveAppFilteredById[appId] || liveAppRegistry.value.liveAppById[appId]
  );
};

export function useStake() {
  const featureFlag = useFeature("stakePrograms");
  const enabledCurrencies = useMemo(
    () => featureFlag?.params?.list || [],
    [featureFlag?.params?.list],
  );
  const redirects = useMemo(
    () => featureFlag?.params?.redirects ?? [],
    [featureFlag?.params?.redirects],
  );
  const partnerSupportedTokens = redirects.map(r => r?.assetId);

  const remoteLiveAppRegistry: Loadable<LiveAppRegistry> = useContext(remoteLiveAppContext).state;

  const getLocalLiveAppManifestById = useContext(
    localLiveAppProviderContext,
  ).getLocalLiveAppManifestById;

  const getManifest = useCallback(
    (platformId: string) => {
      const localManifest = getLocalLiveAppManifestById(platformId);
      const remoteManifest = getRemoteLiveAppManifestById(platformId, remoteLiveAppRegistry);
      console.log(`>> useStake() getManifest`, {
        localManifest: !!localManifest,
        remoteManifest: !!remoteManifest,
      });
      const manifest: LiveAppManifest | undefined = remoteManifest || localManifest;
      return manifest;
    },
    [getLocalLiveAppManifestById, remoteLiveAppRegistry],
  );

  const getPartnerForCurrency = useCallback(
    (currencyId: string) => redirects.find(r => r.assetId === currencyId) ?? null,
    [redirects],
  );

  const getCanStakeUsingPlatformApp = useCallback(
    (currencyId: string) => (!currencyId ? false : partnerSupportedTokens.includes(currencyId)),
    [partnerSupportedTokens],
  );
  const getCanStakeUsingLedgerLive = useCallback(
    (currencyId: string) => (!currencyId ? false : enabledCurrencies.includes(currencyId)),
    [enabledCurrencies],
  );
  const getCanStakeCurrency = useCallback(
    (currencyId: string) =>
      getCanStakeUsingPlatformApp(currencyId) || getCanStakeUsingLedgerLive(currencyId),
    [getCanStakeUsingLedgerLive, getCanStakeUsingPlatformApp],
  );

  // type Route =
  //   | NavigationParamsType
  //   | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PlatformApp>;
  // TODO: return type should be consistent, like NavigationParamsType | null or StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PlatformApp> | null

  /** @returns Base navigator route params to third party platform app. Returns null if not available for provided account or currency.*/
  const getRouteParamsForPlatformApp = useCallback(
    (
      account: Account | TokenAccount | AccountLike,
      walletState: WalletState,
      parentAccount?: Account,
      // currencyId?: string,
    ) => {
      const walletApiAccount = accountToWalletAPIAccount(walletState, account, parentAccount);

      if (isAccountEmpty(account)) {
        console.warn(
          ">> useStake(). Account is empty. Cannot stake. Should go to the NoFunds screen. Previously returned null, now returning NoFundsFlow. EITHER we need to handle it in the hook or in the caller.",
        );
        // return null; // If handled outside
        /** TODO: Final task: check NoFunds flows use this.
         */
        return {
          navigator: NavigatorName.NoFundsFlow,
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        };
      }
      const accountCurrencyId = getAccountCurrency(account)?.id;
      const depositCurrencyId = accountCurrencyId; // || currencyId;

      if (!depositCurrencyId) {
        console.warn(">> No currencyId found for account. Cannot stake.");
        return null;
      }

      const platformId = getPartnerForCurrency(depositCurrencyId)?.platform;
      const manifest = !platformId ? null : getManifest(platformId);

      if (!platformId || !manifest) {
        console.warn(
          `>> No platformId (${platformId}) or manifest ${manifest?.id} found for currency ${depositCurrencyId}. Need to handle it via useStakeDrawer or StakeFlow.`,
        );
        return null;
      }

      // If we pass a customDappURL, it will be used instead of the one from the manifest, and may revert to dapp browser inside the Live App --> dapp browser logic. TODO: Check if we actually need it, or should just send params below.
      // const customDappURL = appendQueryParamsToDappURL(
      //   manifest,
      //   getPartnerForCurrency(depositCurrencyId)?.queryParams,
      // )?.toString();

      return {
        screen: ScreenName.PlatformApp,
        params: {
          platform: manifest.id,
          name: manifest.name,
          accountId: walletApiAccount.id || account.id,
          // TODO: check if we need it in params and dappURL? Does it depend on the manifest api version?
          yieldId: getPartnerForCurrency(depositCurrencyId)?.queryParams?.yieldId,
          chainId: getPartnerForCurrency(depositCurrencyId)?.queryParams?.chainId,
          // customDappURL: customDappURL || undefined,
          ...getPartnerForCurrency(depositCurrencyId)?.queryParams,
        },
      };
    },
    [getPartnerForCurrency, getManifest],
  );

  return {
    enabledCurrencies,
    partnerSupportedTokens,
    getCanStakeCurrency,
    getCanStakeUsingPlatformApp,
    getCanStakeUsingLedgerLive,
    getRouteToStake: getRouteParamsForPlatformApp,
  };
}
