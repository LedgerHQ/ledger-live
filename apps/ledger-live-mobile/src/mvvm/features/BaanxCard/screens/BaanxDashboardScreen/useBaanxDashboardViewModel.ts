import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCardTotalBalance, useCardTransactions } from "@ledgerhq/baanx";
import { useModularDrawerController } from "~/mvvm/features/ModularDrawer/hooks/useModularDrawerController";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { useCategorizedAssetsFromPortfolio } from "~/mvvm/hooks/useCategorizedAssetsFromPortfolio";
import { useDefaultAssetsByCategory } from "~/mvvm/hooks/useDefaultAssetsByCategory";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type { CardData } from "./mockData";
import { MOCK_CARDS, MOCK_TRANSACTIONS } from "./mockData";
import type { TransactionItem } from "./mapCardTransaction";
import { mapCardTxToItem } from "./mapCardTransaction";

export type { TransactionItem };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

const MAX_STABLECOINS = 5;
const SMART_PAY_ID = "smart-pay";
const TOP_UP_CURRENCIES = ["ethereum", "bitcoin"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StablecoinOption {
  readonly id: string;
  readonly ticker: string;
  readonly name: string;
  readonly formattedBalance: string;
}

export interface BaanxDashboardViewModel {
  readonly selectedCurrency: string;
  readonly setSelectedCurrency: (code: string) => void;

  readonly cards: readonly CardData[];
  readonly activeCardIndex: number;
  readonly onCardIndexChange: (index: number) => void;
  readonly totalBalanceValue: number;
  readonly isBalanceLoading: boolean;
  readonly cashbackDisplay: string;
  readonly cashbackRate: number;
  readonly spentThisMonthValue: number;
  readonly spentTrend: number | null;
  readonly spentChartData: readonly number[];
  readonly fiatCurrencySymbol: string;
  readonly discreetMode: boolean;
  readonly onToggleDiscreet: () => void;
  readonly onTopUp: () => void;

  readonly selectedPaymentId: string;
  readonly onSelectPayment: (id: string) => void;
  readonly stablecoins: readonly StablecoinOption[];
  readonly onReorderStablecoins: (data: readonly StablecoinOption[]) => void;
  readonly isSmartPaySheetOpen: boolean;
  readonly onOpenSmartPaySheet: () => void;
  readonly onCloseSmartPaySheet: () => void;

  readonly transactions: readonly TransactionItem[];
  readonly isTransactionsLoading: boolean;
  readonly selectedTransaction: TransactionItem | null;
  readonly isTransactionDetailOpen: boolean;
  readonly onSelectTransaction: (tx: TransactionItem) => void;
  readonly onCloseTransactionDetail: () => void;

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

  readonly isRefreshing: boolean;
  readonly onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// ViewModel hook
// ---------------------------------------------------------------------------

export function useBaanxDashboardViewModel(
  accessToken?: string,
  initialTransactionId?: string,
): BaanxDashboardViewModel {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatCurrency = counterValueCurrency.ticker ?? "EUR";
  const fiatSymbol = counterValueCurrency.symbol ?? fiatCurrency;
  const [selectedCurrency, setSelectedCurrency] = useState(fiatCurrency);

  // --- API data ---
  const isDev = accessToken === "__DEV_BYPASS__";
  const balance = useCardTotalBalance(isDev ? null : accessToken ?? null, fiatCurrency);
  const cardTx = useCardTransactions(isDev ? null : accessToken ?? null);

  const totalBalanceValue = isDev ? 142.3 : balance.totalFiatValue ?? 0;
  const isBalanceLoading = isDev ? false : balance.isLoading;

  const cashbackDisplay = useMemo(() => {
    if (isDev) return "0.00001200 BTC";
    const totals: Record<string, number> = {};
    for (const tx of cardTx.transactions) {
      const cb = tx.raw.cashback;
      if (!isRecord(cb)) continue;
      const amount = Number(cb.amount);
      const currency = String(cb.currency ?? "").toUpperCase();
      if (isNaN(amount) || !currency) continue;
      totals[currency] = (totals[currency] ?? 0) + amount;
    }
    const entries = Object.entries(totals);
    if (entries.length === 0) return "0 BTC";
    return entries.map(([currency, amount]) => `${amount.toFixed(8)} ${currency}`).join(" + ");
  }, [isDev, cardTx.transactions]);
  const cashbackRate = 1;

  const { spentThisMonthValue, spentChartData } = useMemo(() => {
    if (isDev) {
      return {
        spentThisMonthValue: 132.3,
        spentChartData: [20, 25, 22, 30, 28, 35, 50, 48, 55, 70, 65, 80, 90, 85, 95],
      };
    }
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTxs = cardTx.transactions.filter(tx => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const total = monthTxs.reduce((sum, tx) => (tx.amount > 0 ? sum + tx.amount : sum), 0);

    const dailySpend: Record<number, number> = {};
    for (const tx of monthTxs) {
      if (tx.amount <= 0 || !tx.date) continue;
      const day = new Date(tx.date).getDate();
      dailySpend[day] = (dailySpend[day] ?? 0) + tx.amount;
    }
    const spendDays = Object.keys(dailySpend).map(Number);
    const firstDay = spendDays.length > 0 ? Math.min(...spendDays) : 1;
    const today = now.getDate();
    let cumulative = 0;
    const chart: number[] = [];
    for (let d = firstDay; d <= today; d++) {
      cumulative += dailySpend[d] ?? 0;
      chart.push(cumulative);
    }

    return { spentThisMonthValue: total, spentChartData: chart };
  }, [isDev, cardTx.transactions]);

  const spentTrend: number | null = isDev ? 70.32 : null;

  // --- Transactions ---
  const transactions: readonly TransactionItem[] = useMemo(
    () =>
      isDev ? MOCK_TRANSACTIONS : cardTx.transactions.map(tx => mapCardTxToItem(tx, fiatSymbol)),
    [isDev, cardTx.transactions, fiatSymbol],
  );
  const isTransactionsLoading = isDev ? false : cardTx.isLoading;

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);

  const onSelectTransaction = useCallback((tx: TransactionItem) => {
    setSelectedTransaction(tx);
    setIsTransactionDetailOpen(true);
  }, []);

  const onCloseTransactionDetail = useCallback(() => {
    setIsTransactionDetailOpen(false);
  }, []);

  // --- Deep link: auto-open transaction detail ---
  useEffect(() => {
    if (!initialTransactionId || transactions.length === 0) return;
    const tx = transactions.find(t => t.id === initialTransactionId);
    if (tx) {
      setSelectedTransaction(tx);
      setIsTransactionDetailOpen(true);
    }
  }, [initialTransactionId, transactions]);

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
  }, []);

  const onOpenSmartPaySheet = useCallback(() => {
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

  // --- Stablecoins ---
  const { categorizedAssets, stablecoinTickers } = useCategorizedAssetsFromPortfolio();

  const portfolioStablecoins: readonly StablecoinOption[] = useMemo(
    () =>
      categorizedAssets.stablecoins.map(({ currency, balance }) => {
        const unit = currency.units[0];
        const formatted = unit
          ? formatCurrencyUnit(unit, new BigNumber(balance), { showCode: true })
          : `${balance}`;
        return {
          id: currency.id,
          ticker: currency.ticker,
          name: currency.name,
          formattedBalance: formatted,
        };
      }),
    [categorizedAssets.stablecoins],
  );

  const needsDefaults = portfolioStablecoins.length === 0;
  const { stablecoins: defaultStablecoins } = useDefaultAssetsByCategory(
    needsDefaults,
    stablecoinTickers,
    0,
    MAX_STABLECOINS,
  );

  const baseStablecoins: readonly StablecoinOption[] = useMemo(() => {
    if (portfolioStablecoins.length > 0) return portfolioStablecoins;
    return defaultStablecoins.map(({ currency }) => ({
      id: currency.id,
      ticker: currency.ticker,
      name: currency.name,
      formattedBalance: "0",
    }));
  }, [portfolioStablecoins, defaultStablecoins]);

  const [stablecoinOrder, setStablecoinOrder] = useState<readonly string[] | null>(null);

  const stablecoins: readonly StablecoinOption[] = useMemo(() => {
    if (!stablecoinOrder) return baseStablecoins;
    const byId = new Map(baseStablecoins.map(c => [c.id, c]));
    const ordered: StablecoinOption[] = stablecoinOrder.reduce<StablecoinOption[]>((acc, id) => {
      const coin = byId.get(id);
      if (coin) acc.push(coin);
      return acc;
    }, []);
    baseStablecoins.forEach(c => {
      if (!stablecoinOrder.includes(c.id)) ordered.push(c);
    });
    return ordered;
  }, [baseStablecoins, stablecoinOrder]);

  const onReorderStablecoins = useCallback((data: readonly StablecoinOption[]) => {
    setStablecoinOrder(data.map(c => c.id));
  }, []);

  // --- Pull to refresh ---
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    balance.refetch();
    cardTx.refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [balance, cardTx]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    cards: MOCK_CARDS,
    activeCardIndex,
    onCardIndexChange,
    totalBalanceValue,
    isBalanceLoading,
    cashbackDisplay,
    cashbackRate,
    spentThisMonthValue,
    spentTrend,
    spentChartData,
    fiatCurrencySymbol: fiatSymbol,
    discreetMode,
    onToggleDiscreet: toggleDiscreetMode,
    onTopUp,
    selectedPaymentId,
    onSelectPayment,
    stablecoins,
    onReorderStablecoins,
    isSmartPaySheetOpen,
    onOpenSmartPaySheet,
    onCloseSmartPaySheet,
    transactions,
    isTransactionsLoading,
    selectedTransaction,
    isTransactionDetailOpen,
    onSelectTransaction,
    onCloseTransactionDetail,
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
    isRefreshing,
    onRefresh,
  };
}
