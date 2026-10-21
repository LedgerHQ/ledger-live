import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useTradeAvailability } from "@ledgerhq/asset-detail";
import useEnv from "@features/platform-env";
import { useFeatureFlaggedCurrencies } from "@features/platform-currencies";
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
import { setTrackingSource, track } from "@shared/analytics";
import { useBuyNavigation } from "LLD/features/Market/hooks/useBuyNavigation";
import { useSellNavigation } from "LLD/features/Market/hooks/useSellNavigation";
import { useSwapNavigation } from "LLD/features/Market/hooks/useSwapNavigation";
import { useSwapConsoleAbtest } from "LLD/features/AssetDetail/hooks/useSwapConsoleAbtest";
import { resolveRampLedgerIds } from "LLD/features/AssetDetail/utils/resolveRampLedgerIds";

type UseActionBarViewModelProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerCurrency?: CryptoOrTokenCurrency;
  ledgerIds?: readonly string[];
  marketCurrencyData?: MarketCurrencyData;
  tickerHint: string;
  isDistributionLoading: boolean;
  isMarketLoading: boolean;
}>;

export type ActionBarActionId = "swap" | "receive" | "buy" | "sell" | "send";

export type ActionBarAction = Readonly<{
  id: ActionBarActionId;
  label: string;
  isDisabled: boolean;
  onClick: () => void;
  isHighlighted: boolean;
}>;

export type ActionBarViewModel = Readonly<{
  showSkeleton: boolean;
  isCurrencySupported: boolean;
  actions: readonly ActionBarAction[];
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
  const { navigateToSwap } = useSwapNavigation();
  const { isQuickActionEnabled } = useSwapConsoleAbtest();
  const { isCurrencyAvailable } = useRampCatalog();
  const { deactivatedCurrencyIds } = useFeatureFlaggedCurrencies(!!useEnv("MOCK"));

  const ledgerIdsForRamp = useMemo(
    () => resolveRampLedgerIds({ ledgerIds, marketCurrencyData, distributionItem, ledgerCurrency }),
    [ledgerIds, marketCurrencyData, distributionItem, ledgerCurrency],
  );

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

  const { availableOnSwap } = useTradeAvailability(rampActiveLedgerIds);
  const isSwapVisible = isQuickActionEnabled && availableOnSwap && ledgerCurrency !== undefined;

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

  const trackingCurrencyId =
    ledgerCurrency?.id ?? distributionItem?.currency.id ?? rampActiveLedgerIds[0];
  const rampNavigationCurrencyIds =
    rampActiveLedgerIds.length > 1 ? rampActiveLedgerIds : undefined;
  const sendCurrencyIds = useMemo(() => {
    if (ledgerIds && ledgerIds.length > 0) return ledgerIds;
    if (trackingCurrencyId) return [trackingCurrencyId];
    return undefined;
  }, [ledgerIds, trackingCurrencyId]);

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
    openSendFlow({
      source: ASSET_DETAIL_TRACKING_PAGE_NAME,
      currencyIds: sendCurrencyIds,
    });
  }, [openSendFlow, sendCurrencyIds, trackingCurrencyId]);

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

  const onSwap = useCallback(() => {
    if (!ledgerCurrency) return;
    track("button_clicked", {
      button: "swap",
      currency: trackingCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    setTrackingSource(ASSET_DETAIL_TRACKING_PAGE_NAME);
    navigateToSwap(ledgerCurrency);
  }, [ledgerCurrency, navigateToSwap, trackingCurrencyId]);

  const actions = useMemo(() => {
    const candidates: Array<ActionBarAction | false> = [
      isSwapVisible && {
        id: "swap",
        label: t("quickActions.swap"),
        isDisabled: false,
        onClick: onSwap,
        isHighlighted: true,
      },
      {
        id: "receive",
        label: t("quickActions.receive"),
        isDisabled: false,
        onClick: onReceive,
        isHighlighted: !isSwapVisible,
      },
      canBuyOnRamp && {
        id: "buy",
        label: t("quickActions.buy"),
        isDisabled: false,
        onClick: onBuy,
        isHighlighted: false,
      },
      {
        id: "sell",
        label: t("quickActions.sell"),
        isDisabled: !(canSellOnRamp && walletAllowsSellSend),
        onClick: onSell,
        isHighlighted: false,
      },
      {
        id: "send",
        label: t("quickActions.send"),
        isDisabled: !walletAllowsSellSend,
        onClick: onSend,
        isHighlighted: false,
      },
    ];
    return candidates.filter((action): action is ActionBarAction => action !== false);
  }, [
    t,
    isSwapVisible,
    canBuyOnRamp,
    canSellOnRamp,
    walletAllowsSellSend,
    onSwap,
    onReceive,
    onBuy,
    onSell,
    onSend,
  ]);

  return {
    showSkeleton: isPageLoading,
    isCurrencySupported: rampActiveLedgerIds.length > 0,
    actions,
  };
}
