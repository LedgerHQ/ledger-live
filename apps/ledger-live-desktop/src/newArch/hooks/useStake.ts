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
  getAccountSpendableBalance,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
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
  const { params } = useFeature("stakePrograms") || {};
  const enabledCurrencies = useMemo(() => params?.list ?? [], [params?.list]);
  const redirectsMap = useMemo(
    () => new Map(Object.entries(params?.redirects ?? [])),
    [params?.redirects],
  );
  const partnerSupportedAssets = useMemo(() => Array.from(redirectsMap.keys()), [redirectsMap]);
  const getLocalLiveAppManifestById = useContext(
    localLiveAppProviderContext,
  ).getLocalLiveAppManifestById;
  const remoteLiveAppRegistry: Loadable<LiveAppRegistry> = useContext(remoteLiveAppContext).state;

  const getManifest = useCallback(
    (platformId: string) => {
      const localManifest = getLocalLiveAppManifestById(platformId);
      const remoteManifest = getRemoteLiveAppManifestById(platformId, remoteLiveAppRegistry);
      const manifest: LiveAppManifest | undefined = localManifest || remoteManifest;
      return manifest;
    },
    [getLocalLiveAppManifestById, remoteLiveAppRegistry],
  );
  const getPartnerForCurrency = useCallback(
    (currencyId: string) => redirectsMap.get(currencyId) ?? null,
    [redirectsMap],
  );
  const getCanStakeUsingPlatformApp = useCallback(
    (currencyId: string) => (!currencyId ? false : redirectsMap.has(currencyId)),
    [redirectsMap],
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

  /** @returns path and custom params for third party platform app. Returns null if earning strategies are not available for provided account currency. */
  const getRouteToPlatformApp = useCallback(
    (
      account: Account | TokenAccount | AccountLike,
      walletState: WalletState,
      parentAccount?: Account,
    ) => {
      if (getAccountSpendableBalance(account).isZero()) {
        // start stake flow with alwaysShowNoFunds, or return null.
        console.log(`>>> No funds flow (TODO) for account ${account.id}.`);
      }
      const walletApiAccount = accountToWalletAPIAccount(walletState, account, parentAccount);
      const depositCurrency = getAccountCurrency(account);
      const depositCurrencyId = depositCurrency?.id;
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

      /** For tokens, we also need to pass the address of the specific asset being deposited: asset_id={chain_id}_{contract_address} */
      const tokenContractAddress = isTokenAccount(account) ? account.token.contractAddress : null;
      const earningsAccountChainId = manifest.dapp?.networks?.find(
        manifestNetwork =>
          manifestNetwork.currency ===
          (isTokenAccount(account) ? account.token.parentCurrency.id : account.currency.id),
      )?.chainID;
      const assetId = tokenContractAddress
        ? `${earningsAccountChainId}_${tokenContractAddress}`
        : null;

      const earningsAccountId = isTokenAccount(account) ? account.parentId : account.id;
      const accountIdForManifestVersion = deriveAccountIdForManifest(
        earningsAccountId,
        walletApiAccount.id,
        manifest,
      );
      const customPartnerParams = getPartnerForCurrency(depositCurrencyId)?.queryParams ?? {};

      const customDappUrl = appendQueryParamsToDappURL(manifest, {
        ...customPartnerParams,
        ...(assetId ? { asset_id: assetId } : {}),
        accountId: accountIdForManifestVersion,
      })?.toString();

      return {
        pathname: `/platform/${manifest.id}`,
        state: {
          appId: manifest.id,
          name: manifest.name,
          accountId: accountIdForManifestVersion,
          walletAccountId: walletApiAccount.id,
          customDappUrl: customDappUrl ?? undefined,
        },
      };
    },
    [getPartnerForCurrency, getManifest],
  );

  return {
    enabledCurrencies,
    partnerSupportedAssets,
    getCanStakeCurrency,
    getCanStakeUsingPlatformApp,
    getCanStakeUsingLedgerLive,
    getRouteToPlatformApp,
  };
}
