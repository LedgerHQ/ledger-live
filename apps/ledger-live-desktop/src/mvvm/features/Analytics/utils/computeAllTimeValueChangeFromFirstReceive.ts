import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, ValueChange } from "@ledgerhq/types-live";

function meaningfulPercentage(delta: number, divider: number): number | null {
  if (delta && divider && divider !== 0) {
    const percent = delta / divider;
    if (percent < 100_000) return percent;
  }
  return null;
}

export function computeAllTimeValueChangeFromFirstReceive(
  accounts: AccountLike[],
  currentBalance: number,
  cvState: CounterValuesState,
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

  const firstReceiveCountervalue = calculate(cvState, {
    from: firstReceiveCurrency,
    to: cvCurrency,
    value: firstReceiveAmount,
    date: firstReceiveDate,
    disableRounding: true,
  });

  if (typeof firstReceiveCountervalue !== "number" || firstReceiveCountervalue === 0) {
    return { value: currentBalance, percentage: null };
  }

  const value = currentBalance - firstReceiveCountervalue;

  return {
    value,
    percentage: meaningfulPercentage(value, firstReceiveCountervalue),
  };
}
