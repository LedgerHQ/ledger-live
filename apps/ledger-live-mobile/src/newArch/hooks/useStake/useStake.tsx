import { useCallback, useContext, useMemo } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { liveAppContext as remoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppRegistry } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/types";
import { liveAppContext as localLiveAppProviderContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest, Loadable } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  isAccountEmpty,
  isTokenAccount,
} from "@ledgerhq/coin-framework/lib/account/helpers";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { NavigatorName, ScreenName } from "~/const";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { deriveAccountIdForManifest } from "@ledgerhq/live-common/platform/utils/deriveAccountIdForManifest";

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

  /** @returns Base navigator route params to third party platform app. Returns null if not available for provided account or currency.*/
  const getRouteParamsForPlatformApp = useCallback(
    (
      account: Account | TokenAccount | AccountLike,
      walletState: WalletState,
      parentAccount?: Account,
    ) => {
      const walletApiAccount = accountToWalletAPIAccount(walletState, account, parentAccount);

      if (isAccountEmpty(account)) {
        return {
          navigator: NavigatorName.NoFundsFlow,
          screen: ScreenName.NoFunds,
          params: {
            account,
            parentAccount,
          },
        };
      }
      const depositCurrencyId = getAccountCurrency(account)?.id;

      if (!depositCurrencyId) {
        return null;
      }

      const platformId = getPartnerForCurrency(depositCurrencyId)?.platform;
      const manifest = !platformId ? null : getManifest(platformId);

      if (!platformId || !manifest) {
        console.warn(
          `useStake(): No platformId (${platformId}) or manifest ${manifest?.id} found for currency ${depositCurrencyId}. Use useStakeDrawer or StakeFlow.`,
        );
        return null;
      }

      const customPartnerParams = getPartnerForCurrency(depositCurrencyId)?.queryParams ?? {};

      const earningsAccountId = isTokenAccount(account) ? account.parentId : account.id;

      const accountIdForManifestVersion = deriveAccountIdForManifest(
        earningsAccountId,
        walletApiAccount.id,
        manifest,
      );

      const customDappURL = appendQueryParamsToDappURL(manifest, {
        ...customPartnerParams,
        accountId: accountIdForManifestVersion,
      })?.toString();

      return {
        screen: ScreenName.PlatformApp,
        params: {
          platform: manifest.id,
          name: manifest.name,
          accountId: accountIdForManifestVersion,
          ledgerAccountId: account.id,
          walletAccountId: walletApiAccount.id,
          customDappURL: customDappURL ?? undefined,
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
    getRouteParamsForPlatformApp,
  };
}
