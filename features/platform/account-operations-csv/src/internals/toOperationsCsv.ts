import type { AccountOperation } from "@domain/entity-account-operation";
import type { CryptoOrTokenCurrencyId, Currency } from "@domain/entity-currency";
import type { FiatCurrencyTicker } from "@domain/entity-currency-fiat";
import { formatAmount } from "./formatAmount";

const HEADERS = [
  "Operation Date",
  "Status",
  "Currency Ticker",
  "Operation Type",
  "Operation Amount",
  "Operation Fees",
  "Operation Hash",
  "Account Name",
  "Account xpub",
  "Countervalue Ticker",
  "Countervalue at Operation Date",
  "Countervalue at CSV Export",
] as const;

export type OperationsCsvAccount = Readonly<{
  name: string;
  /** What the "Account xpub" column identifies the account with. */
  xpub: string;
  /** The asset of the account itself: its rows carry the fees, the token rows do not. */
  nativeAssetId: CryptoOrTokenCurrencyId;
  operations: readonly AccountOperation[];
}>;

export type OperationsCsvCountervalue = Readonly<{
  currency: Currency;
  /** The fiat the reads valued each operation in at its date; absent for a crypto countervalue. */
  fiatTicker?: FiatCurrencyTicker;
  /**
   * What `amount` of `from`, in its smallest unit, is worth in the countervalue's smallest unit, at
   * `date` or now without it.
   */
  valueOf: (amount: string, from: Currency, date?: Date) => number | null | undefined;
}>;

export type OperationsCsvInput = Readonly<{
  accounts: readonly OperationsCsvAccount[];
  currencyOf: (assetId: CryptoOrTokenCurrencyId) => Currency | undefined;
  countervalue?: OperationsCsvCountervalue;
}>;

/** A cell without the separators the CSV does not escape. */
const toCell = (value: string) => value.replace(/[,\n\r]/g, "");

/** Empty for a missing or zero value, as the legacy export wrote it. */
const countervalueCell = (
  value: number | string | null | undefined,
  countervalue: OperationsCsvCountervalue | undefined,
) =>
  countervalue && value && value !== "0" ? formatAmount(value, countervalue.currency.units[0]) : "";

function toRow(
  account: OperationsCsvAccount,
  operation: AccountOperation,
  { currencyOf, countervalue }: OperationsCsvInput,
): string[] | undefined {
  const currency = currencyOf(operation.assetId);
  if (!currency) return undefined;
  const unit = currency.units[0];
  const valuedByTheRead = countervalue?.fiatTicker
    ? operation.countervalues?.[countervalue.fiatTicker]
    : undefined;
  const atDate =
    valuedByTheRead ?? countervalue?.valueOf(operation.value, currency, new Date(operation.date));
  const atExport = countervalue?.valueOf(operation.value, currency);

  return [
    operation.date,
    operation.hasFailed ? "Failed" : "Confirmed",
    currency.ticker,
    operation.type,
    formatAmount(operation.value, unit),
    operation.assetId === account.nativeAssetId ? formatAmount(operation.fee, unit) : "",
    operation.hash,
    account.name,
    account.xpub,
    countervalue?.currency.ticker ?? "",
    countervalueCell(atDate, countervalue),
    countervalueCell(atExport, countervalue),
  ];
}

/**
 * The operations of accounts as the history CSV: one row per confirmed or failed operation, in the
 * order of the accounts and of their operations. Pending operations are left out.
 */
export function toOperationsCsv(input: OperationsCsvInput): string {
  const rows = input.accounts.flatMap(account =>
    account.operations
      .filter(operation => operation.blockHeight !== null)
      .flatMap(operation => {
        const row = toRow(account, operation, input);
        return row ? [row] : [];
      }),
  );
  return [HEADERS, ...rows].map(row => row.map(toCell).join(",")).join("\r\n");
}
