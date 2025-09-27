import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { calculate } from "@ledgerhq/live-countervalues/logic";

export type GroupedAccount = {
  totalBalance: BigNumber;
  totalFiatValue: BigNumber;
  accounts: AccountLike[];
};

export const groupAccountsByAsset = (
  accounts: AccountLike[],
  counterValuesState: CounterValuesState,
  targetCurrency: Currency,
): Record<string, GroupedAccount> => {
  const initialGroupedAccounts: Record<string, GroupedAccount> = {};

  return accounts.reduce((groupedAccounts, account) => {
    const assetId = account.type === "Account" ? account.currency.id : account.token.id;

    let assetGroup = groupedAccounts[assetId];
    if (!assetGroup) {
      assetGroup = groupedAccounts[assetId] = {
        totalBalance: new BigNumber(0),
        totalFiatValue: new BigNumber(0),
        accounts: [],
      };
    }

    const balance = account.balance;
    const fiatValue = calculateFiatValue(account, counterValuesState, targetCurrency);

    assetGroup.totalBalance = assetGroup.totalBalance.plus(balance);
    assetGroup.totalFiatValue = assetGroup.totalFiatValue.plus(fiatValue || 0);
    assetGroup.accounts.push(account);

    return groupedAccounts;
  }, initialGroupedAccounts);
};

function calculateFiatValue(
  account: AccountLike,
  state: CounterValuesState,
  toCurrency: Currency,
): number {
  const currency = account.type === "Account" ? account.currency : account.token;
  const fiatValue = calculate(state, {
    from: currency,
    to: toCurrency,
    value: account.balance.toNumber(),
  });
  return fiatValue || 0;
}
