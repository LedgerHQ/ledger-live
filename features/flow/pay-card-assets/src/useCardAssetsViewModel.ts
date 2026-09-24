import { useCallback, useMemo, useRef, useState } from "react";
import { useUpdateCardWalletPrioritiesMutation } from "@domain/api-card-management";
import {
  toPayDebitOrderProperties,
  usePayAnalyticsContext,
} from "@features/platform-pay-analytics";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import {
  isCardTransactionFundedBy,
  useCardTransactionsViewModel,
} from "@features/flow-pay-card-transactions";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import { reorderByIndex } from "@shared/ui-list-reorder";
import type { CardAssetRow, CardAssetsProps, CardAssetsStatus, CardAssetsViewModel } from "./types";

const KEY_PREFIX = "payTab.card.assets";
const RECENT_TRANSACTIONS_SHOWN = 3;
const EMPTY_CURRENCIES = new Map();
const NO_PRICE: CardAssetsProps["getCounterValue"] = () => null;
const NO_COUNTERVALUE: CardAssetsProps["formatCountervalue"] = () => "";

export function formatCardAssetCryptoAmount(balance: string | null, currency: string): string {
  const ticker = currency.toUpperCase();
  return balance === null ? ticker : `${balance} ${ticker}`;
}

export function useCardAssetsViewModel(props?: CardAssetsProps): CardAssetsViewModel {
  const {
    currencies = EMPTY_CURRENCIES,
    getCounterValue = NO_PRICE,
    formatCountervalue = NO_COUNTERVALUE,
    formatBalance,
    formatters,
    onTopUp,
    onWithdraw,
    onShowHistory,
    onAddAsset,
  } = props ?? {};
  const { t } = useTranslation();
  const { trackButtonClicked, trackDebitOrderChanged } = usePayAnalyticsContext();
  const [assetOrder, setAssetOrder] = useState<readonly string[]>([]);
  const manageInitialOrder = useRef<readonly string[] | null>(null);
  const [reorderingAssetIds, setReorderingAssetIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Only the most recently issued move's failure gets to roll the order back: an older request
  // resolving after a newer one has already applied would otherwise stomp that newer change.
  const latestMoveRequestId = useRef(0);
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
          ledgerCurrency && balance !== null ? getCounterValue(ledgerCurrency, balance) : null;

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
    [wallets, getCounterValue, formatCountervalue],
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

  const getRecentTransactions = useCallback(
    (asset: CardAssetRow) =>
      asset.ledgerId
        ? transactions
            .filter(item => isCardTransactionFundedBy(item, asset.currency, asset.network))
            .sort((a, b) => b.transaction.dateTime.localeCompare(a.transaction.dateTime))
            .slice(0, RECENT_TRANSACTIONS_SHOWN)
        : [],
    [transactions],
  );

  const status = useMemo<CardAssetsStatus>(() => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (rows.length === 0) return "empty";
    return "ready";
  }, [isLoading, isError, rows.length]);

  const onManageOpen = useCallback(() => {
    manageInitialOrder.current = rows.map(row => row.currency);
    trackButtonClicked({ button: "debit order", page: "Card details" });
  }, [rows, trackButtonClicked]);

  const onManageClose = useCallback(() => {
    const initialOrder = manageInitialOrder.current;
    manageInitialOrder.current = null;
    const order = rows.map(row => row.currency);
    if (initialOrder && initialOrder.join() !== order.join()) {
      trackDebitOrderChanged(toPayDebitOrderProperties(order));
    }
  }, [rows, trackDebitOrderChanged]);

  const onAddAssetPress = useCallback(() => {
    onAddAsset?.();
  }, [onAddAsset]);

  const onMoveAsset = useCallback(
    async (id: string, toIndex: number) => {
      const fromIndex = rows.findIndex(row => row.id === id);
      if (fromIndex < 0 || toIndex < 0 || toIndex >= rows.length || fromIndex === toIndex) return;

      const previousOrder = rows.map(row => row.id);
      const reorderedRows = reorderByIndex(rows, fromIndex, toIndex);
      const requestId = ++latestMoveRequestId.current;

      setReorderingAssetIds(current => new Set(current).add(id));
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

        if (!result.success && latestMoveRequestId.current === requestId) {
          setAssetOrder(previousOrder);
        }
      } catch {
        if (latestMoveRequestId.current === requestId) setAssetOrder(previousOrder);
      } finally {
        setReorderingAssetIds(current => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [rows, updateCardWalletPriorities],
  );

  return useMemo(
    () => ({
      isVisible: props !== undefined && isSignedIn,
      status,
      rows,
      getRecentTransactions,
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
      onTopUp,
      onWithdraw,
      onShowHistory,
      onManageOpen,
      onManageClose,
      onAddAssetPress: onAddAsset ? onAddAssetPress : undefined,
      onMoveAsset,
      reorderingAssetIds,
    }),
    [
      props,
      isSignedIn,
      t,
      status,
      rows,
      getRecentTransactions,
      formatBalance,
      formatters,
      onTopUp,
      onWithdraw,
      onShowHistory,
      onManageOpen,
      onManageClose,
      onAddAsset,
      onAddAssetPress,
      onMoveAsset,
      reorderingAssetIds,
    ],
  );
}
