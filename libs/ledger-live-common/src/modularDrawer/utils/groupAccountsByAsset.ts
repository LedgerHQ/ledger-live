import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { calculate } from "@ledgerhq/live-countervalues/logic";

export type GroupedAccount = {
  totalBalance: BigNumber;
  totalFiatValue: BigNumber;
  accounts: AccountLike[];
  referenceCurrency: CryptoOrTokenCurrency; // Reference currency for magnitude normalization
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
      const currency = account.type === "Account" ? account.currency : account.token;
      assetGroup = groupedAccounts[assetId] = {
        totalBalance: new BigNumber(0),
        totalFiatValue: new BigNumber(0),
        accounts: [],
        referenceCurrency: currency, // First currency becomes the reference
      };
    }

    const currency = account.type === "Account" ? account.currency : account.token;
    const balance = account.balance;

    // Convert balance to reference currency magnitude before summing
    const referenceMagnitude = assetGroup.referenceCurrency.units[0].magnitude || 0;
    const currentMagnitude = currency.units[0].magnitude || 0;
    const magnitudeDiff = referenceMagnitude - currentMagnitude;
    const normalizedBalance = balance.shiftedBy(magnitudeDiff);

    const fiatValue = calculateFiatValue(account, counterValuesState, targetCurrency);

    assetGroup.totalBalance = assetGroup.totalBalance.plus(normalizedBalance);
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

  const balanceNumber = account.balance.toNumber();

  const fiatValue = calculate(state, {
    from: currency,
    to: toCurrency,
    value: balanceNumber,
  });

  return fiatValue || 0;
}
