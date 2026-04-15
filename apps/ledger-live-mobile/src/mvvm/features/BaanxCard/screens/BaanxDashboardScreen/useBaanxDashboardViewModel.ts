import { useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useCardTotalBalance, useCardTransactions, useCashback } from "@ledgerhq/baanx";
import type { CardTransaction } from "@ledgerhq/baanx";
import { useModularDrawerController } from "~/mvvm/features/ModularDrawer/hooks/useModularDrawerController";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { useCategorizedAssetsFromPortfolio } from "~/mvvm/hooks/useCategorizedAssetsFromPortfolio";
import { useDefaultAssetsByCategory } from "~/mvvm/hooks/useDefaultAssetsByCategory";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type { CardData, TransactionItem } from "./mockData";
import { MOCK_CARDS } from "./mockData";

const MAX_STABLECOINS = 5;
const SMART_PAY_ID = "smart-pay";
const TOP_UP_CURRENCIES = ["ethereum", "bitcoin"];

export interface StablecoinOption {
  readonly id: string;
  readonly ticker: string;
  readonly name: string;
}

export interface BaanxDashboardViewModel {
  readonly selectedCurrency: string;
  readonly setSelectedCurrency: (code: string) => void;

  readonly cards: readonly CardData[];
  readonly activeCardIndex: number;
  readonly onCardIndexChange: (index: number) => void;
  readonly totalBalance: string;
  readonly isBalanceLoading: boolean;
  readonly cashback: string;
  readonly discreetMode: boolean;
  readonly onToggleDiscreet: () => void;
  readonly onTopUp: () => void;

  readonly selectedPaymentId: string;
  readonly onSelectPayment: (id: string) => void;
  readonly stablecoins: readonly StablecoinOption[];
  readonly isSmartPaySheetOpen: boolean;
  readonly onOpenSmartPaySheet: () => void;
  readonly onCloseSmartPaySheet: () => void;

  readonly transactions: readonly TransactionItem[];
  readonly isTransactionsLoading: boolean;

  readonly frozenCardIds: ReadonlySet<string>;
  readonly blockedCardIds: ReadonlySet<string>;
  readonly isActiveCardFrozen: boolean;
  readonly isActiveCardBlocked: boolean;
  readonly isSettingsSheetOpen: boolean;
  readonly onOpenSettingsSheet: () => void;
  readonly onCloseSettingsSheet: () => void;
  readonly onFreezeCard: () => void;
  readonly onBlockCard: () => void;
  readonly onCustomizeCard: () => void;
}

function formatFiatAmount(value: number | null, currency: string): string {
  if (value === null) return "—";
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return isToday
      ? `Today ${time}`
      : `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${time}`;
  } catch {
    return dateStr;
  }
}

function mapCardTxToItem(tx: CardTransaction): TransactionItem {
  const sign = tx.amount > 0 ? "-" : "";
  return {
    id: tx.id,
    merchant: tx.merchantName,
    date: fmtDate(tx.date),
    amount: `${sign}${Math.abs(tx.amount).toFixed(2)}`,
    currency: tx.currency,
  };
}

export function useBaanxDashboardViewModel(accessToken?: string): BaanxDashboardViewModel {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatCurrency = counterValueCurrency.ticker ?? "EUR";
  const [selectedCurrency, setSelectedCurrency] = useState(fiatCurrency);

  const balance = useCardTotalBalance(accessToken ?? null, fiatCurrency);
  const cashbackData = useCashback(accessToken ?? null, "usd");
  const cardTx = useCardTransactions(accessToken ?? null);

  const totalBalance = formatFiatAmount(balance.totalFiatValue, balance.fiatCurrency);
  const isBalanceLoading = balance.isLoading;

  const cashback =
    cashbackData.fiatValue !== null
      ? `$${cashbackData.fiatValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : "—";

  const transactions: readonly TransactionItem[] = useMemo(
    () => cardTx.transactions.map(mapCardTxToItem),
    [cardTx.transactions],
  );
  const isTransactionsLoading = cardTx.isLoading;

  // --- Card selection ---
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const onCardIndexChange = useCallback((index: number) => {
    setActiveCardIndex(index);
  }, []);

  const activeCard = MOCK_CARDS[activeCardIndex];

  // --- Balance / discreet mode ---
  const { discreetMode, toggleDiscreetMode } = useToggleDiscreetMode();
  const { openDrawer } = useModularDrawerController();

  const onTopUp = useCallback(() => {
    openDrawer({
      currencies: TOP_UP_CURRENCIES,
      areCurrenciesFiltered: true,
      enableAccountSelection: true,
      source: "BaanxCard",
      flow: "baanx-top-up",
    });
  }, [openDrawer]);

  // --- Pay with ---
  const [selectedPaymentId, setSelectedPaymentId] = useState(SMART_PAY_ID);
  const [isSmartPaySheetOpen, setIsSmartPaySheetOpen] = useState(false);

  const onSelectPayment = useCallback((id: string) => {
    setSelectedPaymentId(id);
    if (id === SMART_PAY_ID) {
      setIsSmartPaySheetOpen(true);
    }
  }, []);

  const onOpenSmartPaySheet = useCallback(() => {
    setSelectedPaymentId(SMART_PAY_ID);
    setIsSmartPaySheetOpen(true);
  }, []);

  const onCloseSmartPaySheet = useCallback(() => {
    setIsSmartPaySheetOpen(false);
  }, []);

  // --- Settings sheet ---
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [frozenCardIds, setFrozenCardIds] = useState<ReadonlySet<string>>(new Set());
  const [blockedCardIds, setBlockedCardIds] = useState<ReadonlySet<string>>(new Set());

  const activeCardId = activeCard.panLast4;
  const isActiveCardFrozen = frozenCardIds.has(activeCardId);
  const isActiveCardBlocked = blockedCardIds.has(activeCardId);

  const onOpenSettingsSheet = useCallback(() => {
    setIsSettingsSheetOpen(true);
  }, []);

  const onCloseSettingsSheet = useCallback(() => {
    setIsSettingsSheetOpen(false);
  }, []);

  const onFreezeCard = useCallback(() => {
    setFrozenCardIds(prev => {
      const next = new Set(prev);
      if (next.has(activeCardId)) next.delete(activeCardId);
      else next.add(activeCardId);
      return next;
    });
    setBlockedCardIds(prev => {
      if (!prev.has(activeCardId)) return prev;
      const next = new Set(prev);
      next.delete(activeCardId);
      return next;
    });
    setIsSettingsSheetOpen(false);
  }, [activeCardId]);

  const onBlockCard = useCallback(() => {
    setBlockedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(activeCardId)) next.delete(activeCardId);
      else next.add(activeCardId);
      return next;
    });
    setFrozenCardIds(prev => {
      if (!prev.has(activeCardId)) return prev;
      const next = new Set(prev);
      next.delete(activeCardId);
      return next;
    });
    setIsSettingsSheetOpen(false);
  }, [activeCardId]);

  const onCustomizeCard = useCallback(() => {
    setIsSettingsSheetOpen(false);
    // TODO: navigate to card customization flow
  }, []);

  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const portfolioStablecoins: readonly StablecoinOption[] = useMemo(
    () =>
      categorizedAssets.stablecoins.map(({ currency }) => ({
        id: currency.id,
        ticker: currency.ticker,
        name: currency.name,
      })),
    [categorizedAssets.stablecoins],
  );

  const needsDefaults = portfolioStablecoins.length === 0;
  const { stablecoins: defaultStablecoins } = useDefaultAssetsByCategory(
    needsDefaults,
    stablecoinTickers,
    0,
    MAX_STABLECOINS,
  );

  const stablecoins: readonly StablecoinOption[] = useMemo(() => {
    if (portfolioStablecoins.length > 0) return portfolioStablecoins;
    return defaultStablecoins.map(({ currency }) => ({
      id: currency.id,
      ticker: currency.ticker,
      name: currency.name,
    }));
  }, [portfolioStablecoins, defaultStablecoins]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    cards: MOCK_CARDS,
    activeCardIndex,
    onCardIndexChange,
    totalBalance,
    isBalanceLoading,
    cashback,
    discreetMode,
    onToggleDiscreet: toggleDiscreetMode,
    onTopUp,
    selectedPaymentId,
    onSelectPayment,
    stablecoins,
    isSmartPaySheetOpen,
    onOpenSmartPaySheet,
    onCloseSmartPaySheet,
    transactions,
    isTransactionsLoading,
    frozenCardIds,
    blockedCardIds,
    isActiveCardFrozen,
    isActiveCardBlocked,
    isSettingsSheetOpen,
    onOpenSettingsSheet,
    onCloseSettingsSheet,
    onFreezeCard,
    onBlockCard,
    onCustomizeCard,
  };
}
