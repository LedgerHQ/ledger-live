import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import {
  flattenAccounts,
  getAccountCurrency,
  isTokenAccount,
} from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import {
  isAvailableOnBuy,
  isAvailableOnSell,
  type MarketCurrencyRampLedgerIds,
} from "LLD/features/Market/utils/rampCatalogAvailability";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { isAssetDetailPageLoading } from "LLD/features/AssetDetail/utils/isAssetDetailPageLoading";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useBuyNavigation } from "LLD/features/Market/hooks/useBuyNavigation";
import { useSellNavigation } from "LLD/features/Market/hooks/useSellNavigation";

type UseActionBarViewModelProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerCurrency?: CryptoOrTokenCurrency;
  ledgerIds?: readonly string[];
  marketCurrencyData?: MarketCurrencyData;
  tickerHint: string;
  isDistributionLoading: boolean;
  isMarketLoading: boolean;
}>;

export type ActionBarViewModel = Readonly<{
  showSkeleton: boolean;
  receiveLabel: string;
  buyLabel: string;
  sellLabel: string;
  sendLabel: string;
  isBuyEnabled: boolean;
  isSellEnabled: boolean;
  isSendEnabled: boolean;
  onBuy: () => void;
  onSell: () => void;
  onSend: () => void;
  onReceive: () => void;
}>;

function pickPrimaryAccount(accounts: AccountLike[]): AccountLike | undefined {
  const withSpendable = accounts.find(account => account.spendableBalance.gt(0));
  if (withSpendable) return withSpendable;
  return (
    accounts.find(account => account.spendableBalance.isZero() && account.balance.gt(0)) ??
    accounts[0]
  );
}

function lookupParentAccount(accounts: Account[], child: AccountLike): Account | undefined {
  if (!isTokenAccount(child)) return undefined;
  return accounts.find(account => account.id === child.parentId);
}

function ledgerIdsFromLedgerCurrency(ledgerCurrency: CryptoOrTokenCurrency): string[] {
  const ids = new Set<string>([ledgerCurrency.id]);
  if (ledgerCurrency.type === "TokenCurrency") {
    ids.add(ledgerCurrency.parentCurrency.id);
  }
  return [...ids];
}

function collectLedgerIdsForRampFromAccounts(accounts: AccountLike[]): string[] {
  const ids = new Set<string>();
  for (const a of accounts) {
    for (const id of ledgerIdsFromLedgerCurrency(getAccountCurrency(a))) {
      ids.add(id);
    }
  }
  return [...ids];
}

function resolvePrimaryAccount(
  distributionItem: DistributionItem | undefined,
  ledgerCurrency: CryptoOrTokenCurrency | undefined,
  allAccounts: Account[],
): AccountLike | undefined {
  const fromDistribution = distributionItem?.accounts ?? [];
  if (fromDistribution.length > 0) {
    return pickPrimaryAccount(fromDistribution);
  }
  if (!ledgerCurrency) return undefined;
  const flattened = flattenAccounts(allAccounts);
  const candidates = getAvailableAccountsById(ledgerCurrency.id, flattened);
  return candidates.length > 0 ? pickPrimaryAccount(candidates) : undefined;
}

export function useActionBarViewModel({
  distributionItem,
  ledgerCurrency,
  ledgerIds,
  marketCurrencyData,
  tickerHint,
  isDistributionLoading,
  isMarketLoading,
}: UseActionBarViewModelProps): ActionBarViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const allAccounts = useSelector(accountsSelector);
  const openSendFlow = useOpenSendFlow();
  const { navigateToBuy } = useBuyNavigation();
  const { navigateToSell } = useSellNavigation();
  const { isCurrencyAvailable } = useRampCatalog();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const ledgerIdsForRamp = useMemo(() => {
    if (ledgerIds?.length) {
      return [...ledgerIds];
    }
    if (marketCurrencyData?.ledgerIds?.length) {
      return marketCurrencyData.ledgerIds;
    }
    const accounts = distributionItem?.accounts;
    if (accounts?.length) {
      return collectLedgerIdsForRampFromAccounts(accounts);
    }
    if (ledgerCurrency?.id) {
      return ledgerIdsFromLedgerCurrency(ledgerCurrency);
    }
    return [];
  }, [ledgerIds, marketCurrencyData, distributionItem, ledgerCurrency]);

  const rampActiveLedgerIds = useMemo(
    () => ledgerIdsForRamp.filter(id => !deactivatedCurrencyIds.has(id)),
    [ledgerIdsForRamp, deactivatedCurrencyIds],
  );

  const rampMarketCurrencyRef = useMemo(
    (): MarketCurrencyRampLedgerIds | undefined =>
      rampActiveLedgerIds.length > 0 ? { ledgerIds: rampActiveLedgerIds } : undefined,
    [rampActiveLedgerIds],
  );

  const canBuyOnRamp = useMemo(
    () => isAvailableOnBuy(rampMarketCurrencyRef, isCurrencyAvailable),
    [rampMarketCurrencyRef, isCurrencyAvailable],
  );

  const canSellOnRamp = useMemo(
    () => isAvailableOnSell(rampMarketCurrencyRef, isCurrencyAvailable),
    [rampMarketCurrencyRef, isCurrencyAvailable],
  );

  const primaryAccount = useMemo(
    () => resolvePrimaryAccount(distributionItem, ledgerCurrency, allAccounts),
    [distributionItem, ledgerCurrency, allAccounts],
  );

  const primaryParentAccount = useMemo(
    () => (primaryAccount ? lookupParentAccount(allAccounts, primaryAccount) : undefined),
    [primaryAccount, allAccounts],
  );

  const walletAllowsSellSend = useMemo(() => {
    const accounts = distributionItem?.accounts ?? [];
    const hasAccounts = accounts.length > 0;
    const hasBalance = accounts.some(account => account.spendableBalance.gt(0));
    const hasPositiveBalanceWithZeroSpendable = accounts.some(
      account => account.spendableBalance.isZero() && account.balance.gt(0),
    );
    return hasAccounts && (hasBalance || hasPositiveBalanceWithZeroSpendable);
  }, [distributionItem]);

  const isPageLoading = isAssetDetailPageLoading(
    isDistributionLoading,
    isMarketLoading,
    Boolean(marketCurrencyData),
  );

  const { isBuyEnabled, isSellEnabled, isSendEnabled } = useMemo(
    () => ({
      isBuyEnabled: canBuyOnRamp,
      isSellEnabled: canSellOnRamp && walletAllowsSellSend,
      isSendEnabled: walletAllowsSellSend,
    }),
    [canBuyOnRamp, canSellOnRamp, walletAllowsSellSend],
  );

  const trackingCurrencyId =
    ledgerCurrency?.id ?? distributionItem?.currency.id ?? rampActiveLedgerIds[0];
  const rampNavigationCurrencyIds =
    rampActiveLedgerIds.length > 1 ? rampActiveLedgerIds : undefined;

  const onBuy = useCallback(() => {
    track("button_clicked", {
      button: "buy",
      currency: trackingCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    setTrackingSource(ASSET_DETAIL_TRACKING_PAGE_NAME);
    navigateToBuy(ledgerCurrency, tickerHint, { currencyIds: rampNavigationCurrencyIds });
  }, [ledgerCurrency, tickerHint, navigateToBuy, trackingCurrencyId, rampNavigationCurrencyIds]);

  const onSell = useCallback(() => {
    track("button_clicked", {
      button: "sell",
      currency: trackingCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    setTrackingSource(ASSET_DETAIL_TRACKING_PAGE_NAME);
    navigateToSell(ledgerCurrency, tickerHint, { currencyIds: rampNavigationCurrencyIds });
  }, [ledgerCurrency, tickerHint, navigateToSell, trackingCurrencyId, rampNavigationCurrencyIds]);

  const onSend = useCallback(() => {
    track("button_clicked", {
      button: "send",
      currency: trackingCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    if (primaryAccount) {
      openSendFlow({
        source: ASSET_DETAIL_TRACKING_PAGE_NAME,
        account: primaryAccount,
        parentAccount: primaryParentAccount,
      });
    } else {
      openSendFlow({ source: ASSET_DETAIL_TRACKING_PAGE_NAME });
    }
  }, [openSendFlow, primaryAccount, primaryParentAccount, trackingCurrencyId]);

  const onReceive = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      currency: trackingCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    dispatch(
      openModal("MODAL_RECEIVE", {
        sourcePage: ASSET_DETAIL_TRACKING_PAGE_NAME,
        ...(primaryAccount ? { account: primaryAccount, parentAccount: primaryParentAccount } : {}),
      }),
    );
  }, [dispatch, primaryAccount, primaryParentAccount, trackingCurrencyId]);

  return {
    showSkeleton: isPageLoading,
    receiveLabel: t("quickActions.receive"),
    buyLabel: t("quickActions.buy"),
    sellLabel: t("quickActions.sell"),
    sendLabel: t("quickActions.send"),
    isBuyEnabled,
    isSellEnabled,
    isSendEnabled,
    onBuy,
    onSell,
    onSend,
    onReceive,
  };
}
