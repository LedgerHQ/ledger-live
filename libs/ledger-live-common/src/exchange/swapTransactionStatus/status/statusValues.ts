import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";
import type { TransactionStatusValue } from "@ledgerhq/wallet-api-exchange-module";

// Built from `Object.values` so it stays in sync if a new TransactionStatus member is added.
const TRANSACTION_STATUS_VALUES: ReadonlySet<string> = new Set(Object.values(TransactionStatus));

export function isTransactionStatusValue(status: string): status is TransactionStatusValue {
  return TRANSACTION_STATUS_VALUES.has(status);
}
