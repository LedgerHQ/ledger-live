import type { CardTransaction } from "@ledgerhq/baanx";

export interface TransactionItem {
  readonly id: string;
  readonly merchant: string;
  readonly date: string;
  readonly amount: string;
  readonly currency: string;
  readonly logoUri?: string;
  readonly logoColor?: string;
  readonly status?: string;
  readonly cardLast4?: string;
  readonly cryptoAmount?: string;
  readonly cryptoCurrency?: string;
  readonly cashbackAmount?: string;
  readonly cashbackCurrency?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
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

function extractPanLast4(raw: Record<string, unknown>): string | undefined {
  const pan = raw.panLast4;
  if (typeof pan !== "string") return undefined;
  const digits = pan.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

const CASHBACK_DECIMALS: Record<string, number> = {
  BTC: 8,
  ETH: 18,
  USDC: 6,
  USDT: 6,
  SOL: 9,
  XRP: 6,
};
const DEFAULT_CASHBACK_DECIMALS = 8;

function formatCashbackAmount(value: number, currency: string): string {
  if (value === 0) return "0";
  const maxDecimals = CASHBACK_DECIMALS[currency] ?? DEFAULT_CASHBACK_DECIMALS;
  const magnitude = -Math.floor(Math.log10(Math.abs(value))) + 1;
  const decimals = Math.min(Math.max(magnitude, 2), maxDecimals);
  return value.toFixed(decimals);
}

function extractCashback(
  raw: Record<string, unknown>,
): { amount: string; currency: string } | undefined {
  const cb = raw.cashback;
  if (!isRecord(cb)) return undefined;
  const amount = Number(cb.amount);
  if (isNaN(amount) || !cb.currency) return undefined;
  const currency = String(cb.currency).toUpperCase();
  return { amount: formatCashbackAmount(amount, currency), currency };
}

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Public mapper
// ---------------------------------------------------------------------------

export function mapCardTxToItem(tx: CardTransaction, fiatSymbol: string): TransactionItem {
  const { raw } = tx;
  const sign = tx.amount > 0 ? "-" : "";
  const cashback = extractCashback(raw);

  return {
    id: tx.id,
    merchant: tx.merchantName,
    date: fmtDate(tx.date),
    amount: `${sign}${fiatSymbol}${Math.abs(tx.amount).toFixed(2)}`,
    currency: tx.currency,
    status: capitalise(String(raw.transactionStatus ?? tx.state)),
    cardLast4: extractPanLast4(raw),
    cashbackAmount: cashback?.amount,
    cashbackCurrency: cashback?.currency,
  };
}
