import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCardTotalBalance, useCardTransactions, useGetUserWalletsQuery } from "@ledgerhq/baanx";
import { useTranslation } from "~/context/Locale";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { selectBaanxTopUpTotal } from "~/reducers/baanxTopUp";
import { ScreenName, NavigatorName } from "~/const";
import { type CardData, MOCK_CARDS } from "./mockData";
import { mapCardTxToItem, type TransactionItem } from "./mapCardTransaction";
import type { AgentData } from "./mockAgentsData";
import type { CreateAgentFormData } from "./components/CreateAgentBottomSheet";
import { useAgentsContext } from "../../AgentsContext";

export type { TransactionItem };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

const SMART_PAY_ID = "smart-pay";

const BAANX_COIN_TO_LEDGER_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  XRP: "ripple",
  SOL: "solana",
  USDC: "ethereum/erc20/usd__coin",
  USDT: "ethereum/erc20/usd_tether__erc20_",
  BXX: "ethereum/erc20/baanx",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StablecoinOption {
  readonly id: string;
  readonly ticker: string;
  readonly name: string;
  readonly formattedBalance: string;
  readonly fiatValue: number;
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
  readonly onViewAllTransactions: () => void;

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

  readonly agents: readonly AgentData[];
  readonly onNavigateToAgent: (agentId: string) => void;
  readonly isCreateAgentSheetOpen: boolean;
  readonly onOpenCreateAgentSheet: () => void;
  readonly onCloseCreateAgentSheet: () => void;
  readonly onCreateAgent: (data: CreateAgentFormData) => void;

  readonly isRefreshing: boolean;
  readonly onRefresh: () => void;

  readonly activeToast: string | null;
  readonly onDismissToast: () => void;
}

// ---------------------------------------------------------------------------
// ViewModel hook
// ---------------------------------------------------------------------------

export function useBaanxDashboardViewModel(
  accessToken?: string,
  initialTransactionId?: string,
  navigateToAgent?: (agentId: string) => void,
): BaanxDashboardViewModel {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const topUpTotal = useSelector(selectBaanxTopUpTotal);
  const fiatCurrency = counterValueCurrency.ticker ?? "EUR";
  const fiatSymbol = counterValueCurrency.symbol ?? fiatCurrency;
  const [selectedCurrency, setSelectedCurrency] = useState(fiatCurrency);

  // --- API data ---
  const balance = useCardTotalBalance(accessToken ?? null, fiatCurrency);
  const cardTx = useCardTransactions(accessToken ?? null);

  const totalBalanceValue = (balance.totalFiatValue ?? 0) + topUpTotal;
  const isBalanceLoading = balance.isLoading;

  const cashbackDisplay = useMemo(() => {
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
  }, [cardTx.transactions]);
  const cashbackRate = 1;

  const { spentThisMonthValue, spentChartData } = useMemo(() => {
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
    const today = now.getDate();
    let cumulative = 0;
    const chart: number[] = [];
    for (let d = 1; d <= today; d++) {
      cumulative += dailySpend[d] ?? 0;
      chart.push(cumulative);
    }

    return { spentThisMonthValue: total, spentChartData: chart };
  }, [cardTx.transactions]);

  const spentTrend: number | null = null;

  // --- Transactions ---
  const transactions: readonly TransactionItem[] = useMemo(
    () => cardTx.transactions.map(tx => mapCardTxToItem(tx, fiatSymbol)),
    [cardTx.transactions, fiatSymbol],
  );
  const isTransactionsLoading = cardTx.isLoading;

  // --- New transaction notifications ---
  const { t } = useTranslation();
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const onDismissToast = useCallback(() => setActiveToast(null), []);

  useEffect(() => {
    if (cardTx.newTransactions.length === 0) return;

    const count = cardTx.newTransactions.length;
    if (count === 1) {
      const tx = cardTx.newTransactions[0];
      setActiveToast(
        t("baanx.notifications.newTransaction", {
          amount: `${fiatSymbol}${Math.abs(tx.amount).toFixed(2)}`,
          merchant: tx.merchantName,
        }),
      );
    } else {
      setActiveToast(t("baanx.notifications.newTransactions", { count }));
    }
  }, [cardTx.newTransactions, t, fiatSymbol]);

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
  const navigation = useNavigation();

  const onViewAllTransactions = useCallback(() => {
    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      ScreenName.BaanxTransactionHistory,
      { accessToken: accessToken ?? "" },
    );
  }, [navigation, accessToken]);

  const { data: walletsData } = useGetUserWalletsQuery(
    { accessToken: accessToken ?? "" },
    { skip: !accessToken },
  );

  const onTopUp = useCallback(() => {
    let addr = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";
    let coin = "XRP";
    let memo: string | undefined;

    if (walletsData && isRecord(walletsData)) {
      const wallets = Array.isArray(walletsData.wallets) ? walletsData.wallets : [];
      const first = wallets.find((w: unknown) => isRecord(w) && w.address && w.coin) as
        | Record<string, unknown>
        | undefined;
      if (first) {
        addr = String(first.address);
        coin = String(first.coin);
        memo = first.destination_tag ? String(first.destination_tag) : undefined;
      }
    }

    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.BaanxTopUp,
      {
        screen: ScreenName.BaanxTopUpAmount,
        params: {
          account: null,
          parentAccount: undefined,
          baanxAddress: addr,
          baanxMemo: memo,
          coinTicker: coin,
        },
      },
    );
  }, [walletsData, navigation]);

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

  // --- Pay-with coins (from Baanx wallets API) ---
  const baanxWalletCoins: readonly StablecoinOption[] = useMemo(
    () =>
      [...balance.wallets]
        .sort((a, b) => {
          const fiatDiff = (b.fiatValue ?? 0) - (a.fiatValue ?? 0);
          if (fiatDiff !== 0) return fiatDiff;
          return (b.balance ?? 0) - (a.balance ?? 0);
        })
        .map(w => {
          const ticker = w.coin.toUpperCase();
          const ledgerId = BAANX_COIN_TO_LEDGER_ID[ticker] ?? ticker.toLowerCase();
          const fiat = w.fiatValue ?? 0;
          return {
            id: ledgerId,
            ticker,
            name: w.coinName ?? ticker,
            formattedBalance:
              fiat > 0
                ? `${fiatSymbol}${fiat.toFixed(2)}`
                : w.balance > 0
                  ? w.balance.toFixed(w.balance < 1 ? 6 : 2)
                  : "0",
            fiatValue: fiat,
          };
        }),
    [balance.wallets, fiatSymbol],
  );

  const [stablecoinOrder, setStablecoinOrder] = useState<readonly string[] | null>(null);

  const stablecoins: readonly StablecoinOption[] = useMemo(() => {
    if (!stablecoinOrder) return baanxWalletCoins;
    const byId = new Map(baanxWalletCoins.map(c => [c.id, c]));
    const ordered: StablecoinOption[] = stablecoinOrder.reduce<StablecoinOption[]>((acc, id) => {
      const coin = byId.get(id);
      if (coin) acc.push(coin);
      return acc;
    }, []);
    baanxWalletCoins.forEach(c => {
      if (!stablecoinOrder.includes(c.id)) ordered.push(c);
    });
    return ordered;
  }, [baanxWalletCoins, stablecoinOrder]);

  const onReorderStablecoins = useCallback((data: readonly StablecoinOption[]) => {
    setStablecoinOrder(data.map(c => c.id));
  }, []);

  // --- Agents ---
  const { agents, setAgents } = useAgentsContext();
  const [isCreateAgentSheetOpen, setIsCreateAgentSheetOpen] = useState(false);

  const onOpenCreateAgentSheet = useCallback(() => {
    setIsCreateAgentSheetOpen(true);
  }, []);

  const onCloseCreateAgentSheet = useCallback(() => {
    setIsCreateAgentSheetOpen(false);
  }, []);

  const ICON_KEYS: AgentData["icon"][] = [
    "UserCircle",
    "UserShield",
    "UserCheck",
    "UserArrowRight",
    "UserLock",
  ];

  const onCreateAgent = useCallback(
    (data: CreateAgentFormData) => {
      const newAgent: AgentData = {
        id: `agent-${Date.now()}`,
        name: data.name,
        icon: ICON_KEYS[agents.length % ICON_KEYS.length],
        status: "idle",
        balance: 0,
        pnlPercent: 0,
        pnlAbsolute: 0,
        pnlPeriod: "7d",
        pnlChartData: [],
        role: data.role,
        activity: [],
      };
      setAgents(prev => [...prev, newAgent]);
      setIsCreateAgentSheetOpen(false);
    },
    [agents.length],
  );

  const onNavigateToAgent = useCallback(
    (agentId: string) => {
      navigateToAgent?.(agentId);
    },
    [navigateToAgent],
  );

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
    onViewAllTransactions,
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
    agents,
    onNavigateToAgent,
    isCreateAgentSheetOpen,
    onOpenCreateAgentSheet,
    onCloseCreateAgentSheet,
    onCreateAgent,
    isRefreshing,
    onRefresh,
    activeToast,
    onDismissToast,
  };
}
