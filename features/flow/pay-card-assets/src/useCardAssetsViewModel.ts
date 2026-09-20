import { useCallback, useMemo, useState } from "react";
import { useUpdateCardWalletPrioritiesMutation } from "@domain/api-card-management";
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
const EMPTY_CURRENCIES = new Map();
const NO_PRICE: CardAssetsProps["priceWallet"] = () => null;
const NO_COUNTERVALUE: CardAssetsProps["formatCountervalue"] = () => "";

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export function useCardAssetsViewModel(props?: CardAssetsProps): CardAssetsViewModel {
  const {
    currencies = EMPTY_CURRENCIES,
    priceWallet = NO_PRICE,
    formatCountervalue = NO_COUNTERVALUE,
    formatBalance,
    formatters,
    onTopUp,
    onWithdraw,
    onShowHistory,
    onAddAsset,
  } = props ?? {};
  const { t } = useTranslation();
  const [dialogState, setDialogState] = useState<CardAssetDialogState>("closed");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetOrder, setAssetOrder] = useState<readonly string[]>([]);
  const [reorderingAssetId, setReorderingAssetId] = useState<string | null>(null);
  const isSignedIn = useIsCardSignedIn();
  const [updateCardWalletPriorities] = useUpdateCardWalletPrioritiesMutation();
  const { transactions } = useCardTransactionsViewModel();
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    currencies,
    skip: !isSignedIn,
  });

  const unorderedRows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(({ id, addressId, balance, currency, network, ledgerId, ledgerCurrency }) => {
        const countervalue =
          ledgerCurrency && balance !== null ? priceWallet(ledgerCurrency, balance) : null;

        return {
          id,
          ...(addressId === undefined ? {} : { addressId }),
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

  const rows = useMemo<readonly CardAssetRow[]>(() => {
    const rowsById = new Map(unorderedRows.map(row => [row.id, row]));
    const orderedRows = assetOrder.flatMap(id => {
      const row = rowsById.get(id);
      if (!row) return [];
      rowsById.delete(id);
      return [row];
    });

    return [...orderedRows, ...rowsById.values()];
  }, [assetOrder, unorderedRows]);

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

  const onReorderAssets = useCallback(
    async (draggedId: string, targetId: string) => {
      if (draggedId === targetId || reorderingAssetId !== null) return;

      const draggedIndex = rows.findIndex(row => row.id === draggedId);
      const targetIndex = rows.findIndex(row => row.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return;

      const previousOrder = rows.map(row => row.id);
      const reorderedRows = [...rows];
      const [draggedRow] = reorderedRows.splice(draggedIndex, 1);
      reorderedRows.splice(targetIndex, 0, draggedRow);
      setReorderingAssetId(draggedId);
      setAssetOrder(reorderedRows.map(row => row.id));

      try {
        const result = await updateCardWalletPriorities({
          wallets: reorderedRows.map((row, index) => {
            if (row.addressId === undefined) {
              throw new Error(`Missing address id for card wallet ${row.id}`);
            }

            return {
              addressId: row.addressId,
              priority: index + 1,
            };
          }),
        }).unwrap();

        if (!result.success) setAssetOrder(previousOrder);
      } catch {
        setAssetOrder(previousOrder);
      } finally {
        setReorderingAssetId(null);
      }
    },
    [reorderingAssetId, rows, updateCardWalletPriorities],
  );

  return useMemo(
    () => ({
      isVisible: props !== undefined && isSignedIn,
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
      onReorderAssets,
      reorderingAssetId,
    }),
    [
      props,
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
      onReorderAssets,
      reorderingAssetId,
    ],
  );
}
