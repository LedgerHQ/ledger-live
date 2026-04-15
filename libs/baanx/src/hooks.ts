import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  useGetUserCardQuery,
  useGetUserWalletsQuery,
  useGetSettingsQuery,
  useGetCardBalanceQuery,
  useGetCardTransactionsQuery,
  useGetWalletTransactionsQuery,
  useGetCardTransactionFundingSourcesQuery,
} from "./api";

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

const COIN_DECIMALS: Record<string, number> = {
  btc: 8,
  eth: 18,
  usdc: 8,
  usdt: 8,
  sol: 9,
  xrp: 6,
  eur: 2,
  gbp: 2,
  eurt: 6,
  bxx: 18,
  usd: 2,
};

function toHumanBalance(raw: unknown, coin: string): number {
  const num = Number(raw ?? 0);
  if (isNaN(num)) return 0;
  const decimals = COIN_DECIMALS[coin.toLowerCase()] ?? 8;
  return num / Math.pow(10, decimals);
}

const COINGECKO_IDS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  usdc: "usd-coin",
  usdt: "tether",
  sol: "solana",
  xrp: "ripple",
  bxx: "baanx",
};

// ---------------------------------------------------------------------------
// useFiatRates — fetch fiat rates from CoinGecko for any target currency
// ---------------------------------------------------------------------------

const FIAT_SELF_RATES: Record<string, string[]> = {
  eur: ["eur", "eurt"],
  usd: ["usd", "usdc", "usdt"],
  gbp: ["gbp"],
};

/**
 * Fetch exchange rates for a list of crypto coins into a target fiat currency.
 * @param coins - Array of coin tickers (e.g. ["btc", "eth", "usdc"])
 * @param fiat - Target fiat currency, defaults to "eur". Supports any CoinGecko vs_currency.
 * @returns Record mapping coin ticker → rate in target fiat
 */
export function useFiatRates(
  coins: string[],
  fiat: string = "eur",
): Record<string, number> {
  const fiatLower = fiat.toLowerCase();

  const selfCoins = useMemo(() => FIAT_SELF_RATES[fiatLower] ?? [], [fiatLower]);

  const buildSelfRates = useCallback(() => {
    const r: Record<string, number> = {};
    for (const c of selfCoins) r[c] = 1;
    return r;
  }, [selfCoins]);

  const [rates, setRates] = useState<Record<string, number>>(buildSelfRates);
  const prevFiat = useRef(fiatLower);

  if (prevFiat.current !== fiatLower) {
    prevFiat.current = fiatLower;
    setRates(buildSelfRates());
  }

  const ids = useMemo(() => {
    const set = new Set<string>();
    for (const c of coins) {
      if (selfCoins.includes(c.toLowerCase())) continue;
      const id = COINGECKO_IDS[c.toLowerCase()];
      if (id) set.add(id);
    }
    return Array.from(set);
  }, [coins, selfCoins]);

  useEffect(() => {
    const baseRates: Record<string, number> = {};
    for (const c of selfCoins) baseRates[c] = 1;

    if (ids.length === 0) {
      setRates(baseRates);
      return;
    }

    let cancelled = false;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=${fiatLower}`;
    fetch(url)
      .then(r => r.json())
      .then((data: Record<string, Record<string, number>>) => {
        if (cancelled) return;
        const newRates: Record<string, number> = { ...baseRates };
        for (const [coin, geckoId] of Object.entries(COINGECKO_IDS)) {
          const rate = data[geckoId]?.[fiatLower];
          if (rate) newRates[coin] = rate;
        }
        setRates(newRates);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ids, fiatLower, selfCoins]);

  return rates;
}

/** @deprecated Use useFiatRates(coins, "eur") instead */
export function useEurRates(coins: string[]): Record<string, number> {
  return useFiatRates(coins, "eur");
}

// ---------------------------------------------------------------------------
// useCardTotalBalance — total portfolio value across all Baanx wallets
// ---------------------------------------------------------------------------

export interface WalletBalance {
  coin: string;
  coinName?: string;
  balance: number;
  fiatValue: number | null;
}

export interface CardTotalBalance {
  wallets: WalletBalance[];
  totalFiatValue: number | null;
  fiatCurrency: string;
  isLoading: boolean;
}

function extractFiatCurrency(data: unknown): string {
  if (!isRecord(data)) return "EUR";
  const currency =
    data.fiat_currency ?? data.fiatCurrency ?? data.currency ?? data.display_currency;
  return currency ? String(currency).toUpperCase() : "EUR";
}

/**
 * Computes the total portfolio value across all Baanx wallets.
 * @param accessToken - Baanx access token
 * @param fiatOverride - Optional fiat currency override (e.g. "usd", "gbp").
 *   If omitted, uses the user's preferred currency from Baanx settings (defaults to "eur").
 */
export function useCardTotalBalance(
  accessToken: string | null,
  fiatOverride?: string,
): CardTotalBalance {
  const skip = !accessToken;
  const token = accessToken ?? "";

  const { data: walletsData, isLoading: wLoading } = useGetUserWalletsQuery(
    { accessToken: token },
    { skip },
  );
  const { data: settingsData } = useGetSettingsQuery({ accessToken: token }, { skip });

  const rawWallets = useMemo(() => {
    if (!isRecord(walletsData)) return [];
    const wallets = Array.isArray(walletsData.wallets) ? walletsData.wallets : [];
    return wallets.filter(isRecord).map(w => ({
      coin: String(w.coin ?? w.currency ?? "?"),
      balance: toHumanBalance(w.balance, String(w.coin ?? "")),
      coinName: w.coin_ledger_name ? String(w.coin_ledger_name) : undefined,
    }));
  }, [walletsData]);

  const settingsCurrency = extractFiatCurrency(settingsData);
  const fiatCurrency = fiatOverride ? fiatOverride.toUpperCase() : settingsCurrency;

  const coins = useMemo(() => rawWallets.map(w => w.coin), [rawWallets]);
  const fiatRates = useFiatRates(coins, fiatCurrency.toLowerCase());

  const wallets: WalletBalance[] = useMemo(
    () =>
      rawWallets.map(w => {
        const rate = fiatRates[w.coin.toLowerCase()];
        return {
          coin: w.coin,
          coinName: w.coinName,
          balance: w.balance,
          fiatValue: rate !== undefined ? w.balance * rate : null,
        };
      }),
    [rawWallets, fiatRates],
  );

  const hasFiat = wallets.some(w => w.fiatValue !== null);
  const totalFiatValue = hasFiat
    ? wallets.reduce((sum, w) => sum + (w.fiatValue ?? 0), 0)
    : null;

  return { wallets, totalFiatValue, fiatCurrency, isLoading: wLoading };
}

// ---------------------------------------------------------------------------
// useCashback — BXX reward balance converted to fiat
// ---------------------------------------------------------------------------

export interface CashbackResult {
  bxxBalance: number;
  fiatValue: number | null;
  fiatCurrency: string;
  isLoading: boolean;
}

/**
 * Returns the user's BXX (cashback/reward) balance converted to the target fiat.
 * Piggybacks on useCardTotalBalance to avoid duplicate API calls.
 */
export function useCashback(
  accessToken: string | null,
  fiatOverride?: string,
): CashbackResult {
  const { wallets, fiatCurrency, isLoading } = useCardTotalBalance(accessToken, fiatOverride);

  const bxxWallet = useMemo(
    () => wallets.find(w => w.coin.toLowerCase() === "bxx"),
    [wallets],
  );

  return {
    bxxBalance: bxxWallet?.balance ?? 0,
    fiatValue: bxxWallet?.fiatValue ?? null,
    fiatCurrency,
    isLoading,
  };
}

// ---------------------------------------------------------------------------
// useCardTransactions — card payment transactions (Monavate POS, ATM, etc.)
// ---------------------------------------------------------------------------

export interface CardTransaction {
  id: string;
  cardId?: string;
  merchantName: string;
  merchantType: string;
  amount: number;
  currency: string;
  state: string;
  date: string | null;
  reversalId: string | null;
  raw: Record<string, unknown>;
}

export interface CardTransactionsResult {
  transactions: CardTransaction[];
  isLoading: boolean;
  error: unknown;
}

function parseCardTx(raw: Record<string, unknown>): CardTransaction {
  return {
    id: String(raw.id ?? ""),
    cardId: raw.card_id ? String(raw.card_id) : undefined,
    merchantName: String(raw.merchantNameLocation ?? "Unknown"),
    merchantType: String(raw.merchantType ?? "—"),
    amount: Number(raw.amountTransactionCurrency ?? 0),
    currency: String(raw.originalTransactionCurrency ?? "EUR"),
    state: String(raw.transaction_state ?? raw.status ?? "—"),
    date: raw.created_at ?? raw.dateTime ?? raw.date
      ? String(raw.created_at ?? raw.dateTime ?? raw.date)
      : null,
    reversalId: raw.reversalAuthorizationId ? String(raw.reversalAuthorizationId) : null,
    raw,
  };
}

export function useCardTransactions(accessToken: string | null): CardTransactionsResult {
  const skip = !accessToken;
  const { data, isLoading, error } = useGetCardTransactionsQuery(
    { accessToken: accessToken ?? "" },
    { skip },
  );

  const transactions = useMemo(() => {
    if (!isRecord(data)) return [];
    const txs = Array.isArray(data.transactions) ? data.transactions : [];
    return txs.filter(isRecord).map(parseCardTx);
  }, [data]);

  return { transactions, isLoading, error };
}

// ---------------------------------------------------------------------------
// useCardTransactionFundingSources — funding sources for a card transaction
// ---------------------------------------------------------------------------

export interface FundingSource {
  [key: string]: unknown;
}

export interface FundingSourcesResult {
  sources: FundingSource[];
  isLoading: boolean;
  error: unknown;
}

export function useCardTransactionFundingSources(
  accessToken: string | null,
  transactionId: string | null,
): FundingSourcesResult {
  const skip = !accessToken || !transactionId;
  const { data, isLoading, error } = useGetCardTransactionFundingSourcesQuery(
    { accessToken: accessToken ?? "", transactionId: transactionId ?? "" },
    { skip },
  );

  const sources = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(isRecord);
    if (isRecord(data) && Array.isArray(data.funding_sources)) {
      return data.funding_sources.filter(isRecord);
    }
    if (isRecord(data) && Array.isArray(data.data)) {
      return data.data.filter(isRecord);
    }
    return isRecord(data) ? [data] : [];
  }, [data]);

  return { sources, isLoading, error };
}

// ---------------------------------------------------------------------------
// useAggregatedWalletTransactions — crypto transactions across all wallets
// ---------------------------------------------------------------------------

export interface WalletTransaction {
  walletCoin: string;
  walletAddress: string;
  raw: Record<string, unknown>;
}

export interface WalletInfo {
  address: string;
  coin: string;
  coinName?: string;
}

export interface AggregatedWalletTransactionsResult {
  transactions: WalletTransaction[];
  wallets: WalletInfo[];
  isLoading: boolean;
  loadedWallets: number;
}

function extractWallets(data: unknown): WalletInfo[] {
  if (!isRecord(data)) return [];
  const wallets = Array.isArray(data.wallets) ? data.wallets : [];
  return wallets
    .filter((w): w is Record<string, unknown> => isRecord(w) && "address" in w && "coin" in w)
    .map(w => ({
      address: String(w.address),
      coin: String(w.coin),
      coinName: w.coin_ledger_name ? String(w.coin_ledger_name) : undefined,
    }));
}

function WalletTxCollector({
  wallet,
  accessToken,
  onResult,
}: {
  wallet: WalletInfo;
  accessToken: string;
  onResult: (key: string, txs: WalletTransaction[], loading: boolean) => void;
}) {
  const { data, isLoading } = useGetWalletTransactionsQuery({
    accessToken,
    address: wallet.address,
    coin: wallet.coin,
  });

  const key = `${wallet.coin}-${wallet.address}`;

  useEffect(() => {
    if (!isRecord(data)) {
      onResult(key, [], isLoading);
      return;
    }
    const txs = Array.isArray(data.transactions) ? data.transactions : [];
    const parsed: WalletTransaction[] = txs.filter(isRecord).map(tx => ({
      walletCoin: wallet.coinName ?? wallet.coin,
      walletAddress: wallet.address,
      raw: tx,
    }));
    onResult(key, parsed, isLoading);
  }, [data, isLoading, key, onResult, wallet]);

  return null;
}

export { WalletTxCollector };

export function useAggregatedWalletTransactions(
  accessToken: string | null,
): AggregatedWalletTransactionsResult {
  const skip = !accessToken;
  const { data: walletsData, isLoading: wLoading } = useGetUserWalletsQuery(
    { accessToken: accessToken ?? "" },
    { skip },
  );

  const wallets = useMemo(() => extractWallets(walletsData), [walletsData]);

  const [allTxs, setAllTxs] = useState<Record<string, WalletTransaction[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const allTxsRef = useRef(allTxs);
  const loadingMapRef = useRef(loadingMap);

  const onResult = useCallback(
    (walletKey: string, txs: WalletTransaction[], loading: boolean) => {
      if (allTxsRef.current[walletKey] !== txs) {
        const next = { ...allTxsRef.current, [walletKey]: txs };
        allTxsRef.current = next;
        setAllTxs(next);
      }
      if (loadingMapRef.current[walletKey] !== loading) {
        const next = { ...loadingMapRef.current, [walletKey]: loading };
        loadingMapRef.current = next;
        setLoadingMap(next);
      }
    },
    [],
  );

  const transactions = useMemo(
    () =>
      Object.values(allTxs)
        .flat()
        .sort((a, b) => {
          const da = String(a.raw.created_at ?? a.raw.dateTime ?? a.raw.date ?? "");
          const db = String(b.raw.created_at ?? b.raw.dateTime ?? b.raw.date ?? "");
          return db.localeCompare(da);
        }),
    [allTxs],
  );

  const anyLoading = wLoading || Object.values(loadingMap).some(Boolean);

  return {
    transactions,
    wallets,
    isLoading: anyLoading,
    loadedWallets: Object.keys(allTxs).length,
  };
}

// ---------------------------------------------------------------------------
// useCardInfo — card status + Monavate balance + settings in one hook
// ---------------------------------------------------------------------------

export interface CardInfo {
  hasCard: boolean;
  provider: string | null;
  monavateBalance: {
    available: number;
    balance: number;
    currency: string;
  } | null;
  fiatCurrency: string;
  isLoading: boolean;
}

export function useCardInfo(accessToken: string | null): CardInfo {
  const skip = !accessToken;
  const token = accessToken ?? "";

  const { data: cardData, isLoading: cardLoading } = useGetUserCardQuery(
    { accessToken: token },
    { skip },
  );
  const { data: balanceData, isLoading: balLoading } = useGetCardBalanceQuery(
    { accessToken: token },
    { skip },
  );
  const { data: settingsData } = useGetSettingsQuery({ accessToken: token }, { skip });

  const hasCard = isRecord(cardData) && cardData.hasCard === true;
  const provider =
    isRecord(cardData) && isRecord(cardData.details)
      ? String(cardData.details.provider ?? "")
      : null;

  const monavateBalance = useMemo(() => {
    if (!isRecord(balanceData)) return null;
    const ab = balanceData.availableBalance;
    const bal = balanceData.balance;
    if (!isRecord(ab) || !isRecord(bal)) return null;
    return {
      available: Number(ab.amount ?? 0),
      balance: Number(bal.amount ?? 0),
      currency: String(ab.currencyCode ?? "EUR"),
    };
  }, [balanceData]);

  return {
    hasCard,
    provider,
    monavateBalance,
    fiatCurrency: extractFiatCurrency(settingsData),
    isLoading: cardLoading || balLoading,
  };
}
