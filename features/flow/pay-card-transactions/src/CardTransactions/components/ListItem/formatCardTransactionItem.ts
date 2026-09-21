import type {
  PayCardTransaction,
  PayCardTransactionFundingSource,
} from "@domain/api-card-management";
import type { FormatCardTransactionAmount, FormatCardTransactionDate } from "../../../types";

function signedValue(value: string, sign: "DEBIT" | "CREDIT"): string {
  return `${sign === "DEBIT" ? "-" : "+"}${value}`;
}

function defaultFormatAmount(value: string, currency: string): string {
  return `${value} ${currency.toUpperCase()}`;
}

export function formatSignedAmount(
  transaction: PayCardTransaction,
  formatAmount: FormatCardTransactionAmount = defaultFormatAmount,
): string {
  return formatAmount(
    signedValue(transaction.amountInTransactionCurrency, transaction.sign),
    transaction.transactionCurrency,
    "fiat",
  );
}

export function formatFundingSources(
  fundingSources: readonly PayCardTransactionFundingSource[] | undefined,
  formatAmount: FormatCardTransactionAmount = defaultFormatAmount,
): string | undefined {
  if (!fundingSources?.length) return undefined;

  return fundingSources
    .map(({ amount, currency, sign }) =>
      formatAmount(signedValue(amount, sign), currency, "crypto"),
    )
    .join(" · ");
}

export function formatMerchantName(merchantNameLocation: string): string {
  const locationSeparator = merchantNameLocation.lastIndexOf(",");
  if (locationSeparator === -1) return merchantNameLocation;

  const merchantName = merchantNameLocation.slice(0, locationSeparator).trim();
  return merchantName || merchantNameLocation;
}

function defaultFormatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function formatCardTransactionDate(
  dateTime: string,
  formatDate: FormatCardTransactionDate = defaultFormatDate,
): string {
  const date = parseTransactionDate(dateTime);

  return date ? formatDate(date) : dateTime;
}

export function formatMaskedPanLast4(panLast4: string): string {
  return `***${panLast4}`;
}

function parseTransactionDate(dateTime: string): Date | undefined {
  const date = new Date(dateTime);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatTimeOfDay(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export type TranslateTransactionDetailDate = (
  key: "today" | "yesterday" | "dateTime",
  options: Readonly<{ time: string; date?: string }>,
) => string;

export function formatTransactionDetailDateTime(
  dateTime: string,
  translate: TranslateTransactionDetailDate,
  formatDate: FormatCardTransactionDate = defaultFormatDate,
  now: Date = new Date(),
): string {
  const date = parseTransactionDate(dateTime);
  if (!date) return dateTime;

  const time = formatTimeOfDay(date);
  if (isSameCalendarDay(date, now)) {
    return translate("today", { time });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) {
    return translate("yesterday", { time });
  }

  return translate("dateTime", { date: formatDate(date), time });
}
