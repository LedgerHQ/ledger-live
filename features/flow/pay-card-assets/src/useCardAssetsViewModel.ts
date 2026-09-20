import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import {
  isCardTransactionFundedBy,
  useCardTransactionsViewModel,
} from "@features/flow-pay-card-transactions";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type {
  CardAssetDialogState,
  CardAssetRow,
  CardAssetsProps,
  CardAssetsStatus,
  CardAssetsViewModel,
} from "./types";

const KEY_PREFIX = "payTab.card.assets";
const RECENT_TRANSACTIONS_SHOWN = 3;

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export function useCardAssetsViewModel({
  currencies,
  priceWallet,
  formatCountervalue,
  formatBalance,
  formatters,
  onTopUp,
  onWithdraw,
  onShowHistory,
  onAddAsset,
}: CardAssetsProps): CardAssetsViewModel {
  const { t } = useTranslation();
  const [dialogState, setDialogState] = useState<CardAssetDialogState>("closed");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const isSignedIn = useIsCardSignedIn();
  const { transactions } = useCardTransactionsViewModel();
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    currencies,
    skip: !isSignedIn,
  });

  const rows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(({ id, balance, currency, network, ledgerId, ledgerCurrency }) => {
        const countervalue =
          ledgerCurrency && balance !== null ? priceWallet(ledgerCurrency, balance) : null;

        return {
          id,
          currency,
          network,
          name: ledgerCurrency?.name ?? currency.toUpperCase(),
          ticker: ledgerCurrency?.ticker ?? currency.toUpperCase(),
          ledgerId: ledgerId ?? "",
          cryptoAmount: formatCardAssetCryptoAmount(balance, currency),
          countervalue: countervalue === null ? null : formatCountervalue(countervalue),
          countervalueAmount: countervalue,
        };
      }),
    [wallets, priceWallet, formatCountervalue],
  );

  const selectedAsset = useMemo(
    () => rows.find(asset => asset.id === selectedAssetId) ?? null,
    [rows, selectedAssetId],
  );
  const selectedAssetTransactions = useMemo(
    () =>
      selectedAsset?.ledgerId
        ? transactions
            .filter(item =>
              isCardTransactionFundedBy(item, selectedAsset.currency, selectedAsset.network),
            )
            .sort((a, b) => b.transaction.dateTime.localeCompare(a.transaction.dateTime))
            .slice(0, RECENT_TRANSACTIONS_SHOWN)
        : [],
    [selectedAsset, transactions],
  );

  const status = useMemo<CardAssetsStatus>(() => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (rows.length === 0) return "empty";
    return "ready";
  }, [isLoading, isError, rows.length]);

  const onAssetPress = useCallback((asset: CardAssetRow) => {
    setSelectedAssetId(asset.id);
    setDialogState("details");
  }, []);

  const onDialogClose = useCallback(() => {
    setDialogState("closed");
    setSelectedAssetId(null);
  }, []);

  const onTopUpPress = useCallback(() => {
    if (selectedAsset) onTopUp?.(selectedAsset);
  }, [onTopUp, selectedAsset]);

  const onWithdrawPress = useCallback(() => {
    setDialogState("withdraw");
  }, []);

  const onWithdrawClose = useCallback(() => {
    setDialogState("details");
  }, []);

  // History is a host route, not a dialog: hand the asset over and leave the dialogs closed.
  const onShowHistoryPress = useCallback(() => {
    if (selectedAsset) onShowHistory?.(selectedAsset);
    onDialogClose();
  }, [onDialogClose, onShowHistory, selectedAsset]);

  const onWithdrawContinue = useCallback(() => {
    if (selectedAsset) onWithdraw?.(selectedAsset);
    onDialogClose();
  }, [onDialogClose, onWithdraw, selectedAsset]);

  const onManagePress = useCallback(() => {
    setDialogState("manage");
  }, []);

  const onAddAssetPress = useCallback(() => {
    onAddAsset?.();
  }, [onAddAsset]);

  return useMemo(
    () => ({
      isVisible: isSignedIn,
      status,
      rows,
      dialogState,
      selectedAsset,
      selectedAssetTransactions,
      formatBalance,
      formatters,
      dialogCopy: {
        topUp: t(`${KEY_PREFIX}.details.topUp`),
        withdraw: t(`${KEY_PREFIX}.details.withdraw`),
        transactions: t(`${KEY_PREFIX}.details.transactions`),
        withdrawTitle: t(`${KEY_PREFIX}.withdraw.title`),
        withdrawDescription: t(`${KEY_PREFIX}.withdraw.description`),
        continue: t(`${KEY_PREFIX}.withdraw.continue`),
      },
      onAssetPress,
      onDialogClose,
      onTopUpPress,
      onWithdrawPress,
      onWithdrawClose,
      onShowHistoryPress,
      onWithdrawContinue,
      onManagePress,
      onAddAssetPress,
    }),
    [
      isSignedIn,
      t,
      status,
      rows,
      dialogState,
      selectedAsset,
      selectedAssetTransactions,
      formatBalance,
      formatters,
      onAssetPress,
      onDialogClose,
      onTopUpPress,
      onWithdrawPress,
      onWithdrawClose,
      onShowHistoryPress,
      onWithdrawContinue,
      onManagePress,
      onAddAssetPress,
    ],
  );
}
