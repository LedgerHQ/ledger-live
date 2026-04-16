import { useState, useCallback, useMemo } from "react";
import { useCardTransactions } from "@ledgerhq/baanx";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { mapCardTxToItem, type TransactionItem } from "../BaanxDashboardScreen/mapCardTransaction";

export type FilterType = "all" | "sent" | "received" | "pending";
export type FilterAsset = "all" | string;

export interface TransactionSection {
  readonly title: string;
  readonly data: readonly TransactionItem[];
}

export interface BaanxTransactionHistoryViewModel {
  readonly sections: readonly TransactionSection[];
  readonly isLoading: boolean;
  readonly selectedType: FilterType;
  readonly selectedAsset: FilterAsset;
  readonly availableAssets: readonly string[];
  readonly onSelectType: (type: FilterType) => void;
  readonly onSelectAsset: (asset: FilterAsset) => void;
  readonly selectedTransaction: TransactionItem | null;
  readonly isTransactionDetailOpen: boolean;
  readonly onSelectTransaction: (tx: TransactionItem) => void;
  readonly onCloseTransactionDetail: () => void;
}

function groupByDate(items: readonly TransactionItem[]): TransactionSection[] {
  const groups = new Map<string, TransactionItem[]>();
  const now = new Date();
  const todayStr = now.toDateString();

  for (const tx of items) {
    let sectionTitle: string;
    if (tx.date.startsWith("Today")) {
      sectionTitle = "Today";
    } else {
      const parts = tx.date.split(" ");
      if (parts.length >= 2) {
        const [day, month] = parts;
        const year = now.getFullYear();
        const parsed = new Date(`${month} ${day}, ${year}`);
        sectionTitle =
          parsed.toDateString() === todayStr
            ? "Today"
            : parsed.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
      } else {
        sectionTitle = tx.date;
      }
    }

    const existing = groups.get(sectionTitle);
    if (existing) {
      existing.push(tx);
    } else {
      groups.set(sectionTitle, [tx]);
    }
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

export function useBaanxTransactionHistoryViewModel(
  accessToken?: string,
): BaanxTransactionHistoryViewModel {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatSymbol = counterValueCurrency.symbol ?? counterValueCurrency.ticker ?? "EUR";

  const cardTx = useCardTransactions(accessToken ?? null);

  const allItems: readonly TransactionItem[] = useMemo(
    () => cardTx.transactions.map(tx => mapCardTxToItem(tx, fiatSymbol)),
    [cardTx.transactions, fiatSymbol],
  );

  const availableAssets: readonly string[] = useMemo(() => {
    const set = new Set<string>();
    for (const tx of allItems) {
      if (tx.currency) set.add(tx.currency.toUpperCase());
    }
    return Array.from(set).sort();
  }, [allItems]);

  const [selectedType, setSelectedType] = useState<FilterType>("all");
  const [selectedAsset, setSelectedAsset] = useState<FilterAsset>("all");

  const onSelectType = useCallback((type: FilterType) => setSelectedType(type), []);
  const onSelectAsset = useCallback((asset: FilterAsset) => setSelectedAsset(asset), []);

  const filteredItems = useMemo(() => {
    let items = [...allItems];

    if (selectedType !== "all") {
      items = items.filter(tx => {
        const status = tx.status?.toLowerCase();
        switch (selectedType) {
          case "sent":
            return tx.amount.startsWith("-");
          case "received":
            return !tx.amount.startsWith("-") && tx.amount !== "$0.00";
          case "pending":
            return status === "pending";
          default:
            return true;
        }
      });
    }

    if (selectedAsset !== "all") {
      items = items.filter(tx => tx.currency.toUpperCase() === selectedAsset.toUpperCase());
    }

    return items;
  }, [allItems, selectedType, selectedAsset]);

  const sections = useMemo(() => groupByDate(filteredItems), [filteredItems]);

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);

  const onSelectTransaction = useCallback((tx: TransactionItem) => {
    setSelectedTransaction(tx);
    setIsTransactionDetailOpen(true);
  }, []);

  const onCloseTransactionDetail = useCallback(() => {
    setIsTransactionDetailOpen(false);
  }, []);

  return {
    sections,
    isLoading: cardTx.isLoading,
    selectedType,
    selectedAsset,
    availableAssets,
    onSelectType,
    onSelectAsset,
    selectedTransaction,
    isTransactionDetailOpen,
    onSelectTransaction,
    onCloseTransactionDetail,
  };
}
