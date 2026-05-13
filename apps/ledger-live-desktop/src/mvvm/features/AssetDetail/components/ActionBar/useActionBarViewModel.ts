import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useBuyNavigation } from "LLD/features/Market/hooks/useBuyNavigation";
import { useSellNavigation } from "LLD/features/Market/hooks/useSellNavigation";

type UseActionBarViewModelProps = Readonly<{
  distributionItem: DistributionItem | undefined;
  ledgerCurrency: CryptoOrTokenCurrency | undefined;
  tickerHint: string;
}>;

export type ActionBarViewModel = Readonly<{
  receiveLabel: string;
  buyLabel: string;
  sellLabel: string;
  sendLabel: string;
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
  tickerHint,
}: UseActionBarViewModelProps): ActionBarViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const allAccounts = useSelector(accountsSelector);
  const openSendFlow = useOpenSendFlow();
  const { navigateToBuy } = useBuyNavigation();
  const { navigateToSell } = useSellNavigation();

  const primaryAccount = useMemo(
    () => resolvePrimaryAccount(distributionItem, ledgerCurrency, allAccounts),
    [distributionItem, ledgerCurrency, allAccounts],
  );

  const primaryParentAccount = useMemo(
    () => (primaryAccount ? lookupParentAccount(allAccounts, primaryAccount) : undefined),
    [primaryAccount, allAccounts],
  );

  const { isSellEnabled, isSendEnabled } = useMemo(() => {
    const accounts = distributionItem?.accounts ?? [];
    const hasAccounts = accounts.length > 0;
    const hasBalance = accounts.some(account => account.spendableBalance.gt(0));
    const hasPositiveBalanceWithZeroSpendable = accounts.some(
      account => account.spendableBalance.isZero() && account.balance.gt(0),
    );
    const enabled = hasAccounts && (hasBalance || hasPositiveBalanceWithZeroSpendable);
    return { isSellEnabled: enabled, isSendEnabled: enabled };
  }, [distributionItem]);

  const onBuy = useCallback(() => {
    track("button_clicked2", {
      button: "buy",
      currency: ledgerCurrency?.ticker ?? tickerHint,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      flow: "buy",
    });
    setTrackingSource(ASSET_DETAIL_TRACKING_PAGE_NAME);
    navigateToBuy(ledgerCurrency, tickerHint);
  }, [ledgerCurrency, tickerHint, navigateToBuy]);

  const onSell = useCallback(() => {
    track("button_clicked2", {
      button: "sell",
      currency: ledgerCurrency?.ticker ?? tickerHint,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      flow: "sell",
    });
    setTrackingSource(ASSET_DETAIL_TRACKING_PAGE_NAME);
    navigateToSell(ledgerCurrency, tickerHint);
  }, [ledgerCurrency, tickerHint, navigateToSell]);

  const onSend = useCallback(() => {
    if (primaryAccount) {
      openSendFlow({
        source: ASSET_DETAIL_TRACKING_PAGE_NAME,
        account: primaryAccount,
        parentAccount: primaryParentAccount,
      });
    } else {
      openSendFlow({ source: ASSET_DETAIL_TRACKING_PAGE_NAME });
    }
  }, [openSendFlow, primaryAccount, primaryParentAccount]);

  const onReceive = useCallback(() => {
    track("button_clicked2", {
      button: "receive",
      currency: ledgerCurrency?.ticker ?? tickerHint,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      flow: "receive",
    });
    dispatch(
      openModal("MODAL_RECEIVE", {
        sourcePage: ASSET_DETAIL_TRACKING_PAGE_NAME,
        ...(primaryAccount ? { account: primaryAccount, parentAccount: primaryParentAccount } : {}),
      }),
    );
  }, [dispatch, primaryAccount, primaryParentAccount, ledgerCurrency?.ticker, tickerHint]);

  return {
    receiveLabel: t("quickActions.receive"),
    buyLabel: t("quickActions.buy"),
    sellLabel: t("quickActions.sell"),
    sendLabel: t("quickActions.send"),
    isSellEnabled,
    isSendEnabled,
    onBuy,
    onSell,
    onSend,
    onReceive,
  };
}
