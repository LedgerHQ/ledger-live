import type {
  PayCardTransaction,
  PayCardTransactionFundingSource,
} from "@domain/api-card-management";
import type { FormatCardTransactionAmount } from "../../../types";

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

export function formatCardTransactionDate(dateTime: string, locale: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
