import {
  getAccountCurrency,
  flattenAccounts,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
import { meaningfulPercentage } from "./meaningfulPercentage";
import { getRateLookup, type RateSnapshot } from "./rateLookup";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike, ValueChange } from "@ledgerhq/types-live";

export function computeAllTimeValueChangeFromFirstReceive(
  accounts: AccountLike[],
  currentBalance: number,
  cvState: RateSnapshot,
  cvCurrency: Currency,
): ValueChange {
  let firstReceiveDate: Date | undefined;
  let firstReceiveAmount = 0;
  let firstReceiveCurrency: Currency | undefined;

  for (const account of flattenAccounts(accounts)) {
    for (const operation of account.operations) {
      if (operation.type !== "IN") continue;
      if (!firstReceiveDate || operation.date < firstReceiveDate) {
        firstReceiveDate = operation.date;
        firstReceiveAmount = getOperationAmountNumber(operation).toNumber();
        firstReceiveCurrency = getAccountCurrency(account);
      }
    }
  }

  if (!firstReceiveDate || !firstReceiveCurrency) {
    return { value: 0, percentage: null };
  }

  const firstReceiveCountervalue = getRateLookup().calculate(cvState, {
    from: firstReceiveCurrency,
    to: cvCurrency,
    value: firstReceiveAmount,
    date: firstReceiveDate,
    disableRounding: true,
  });

  if (typeof firstReceiveCountervalue !== "number") {
    return { value: 0, percentage: null };
  }

  const value = currentBalance - firstReceiveCountervalue;

  return {
    value,
    percentage: value === 0 ? 0 : (meaningfulPercentage(value, firstReceiveCountervalue) ?? null),
  };
}
