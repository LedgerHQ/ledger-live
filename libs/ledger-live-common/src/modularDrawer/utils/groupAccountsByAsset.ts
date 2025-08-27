import { getBalanceAndFiatValue } from "./getBalanceAndFiatValue";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { parseToBigNumber } from "./parseToBigNumber";

export type GroupedAccount = {
  totalBalance: BigNumber;
  totalFiatValue: BigNumber;
  accounts: AccountLike[];
};

export const groupAccountsByAsset = (
  accounts: AccountLike[],
  counterValuesState: CounterValuesState,
  targetCurrency: Currency,
  isDiscreetMode: boolean,
): Record<string, GroupedAccount> => {
  const initialGroupedAccounts: Record<string, GroupedAccount> = {};

  return accounts.reduce((groupedAccounts, account) => {
    const assetId = account.type === "Account" ? account.currency.id : account.token.id;

    if (!groupedAccounts[assetId]) {
      groupedAccounts[assetId] = {
        totalBalance: new BigNumber(0),
        totalFiatValue: new BigNumber(0),
        accounts: [],
      };
    }

    const { fiatValue } = getBalanceAndFiatValue(
      account,
      counterValuesState,
      targetCurrency,
      isDiscreetMode,
      false,
    );
    const balance = account.balance;

    const parsedFiatValue = parseToBigNumber(fiatValue ?? "0");

    groupedAccounts[assetId].totalBalance = groupedAccounts[assetId].totalBalance.plus(balance);
    groupedAccounts[assetId].totalFiatValue =
      groupedAccounts[assetId].totalFiatValue.plus(parsedFiatValue);
    groupedAccounts[assetId].accounts.push(account);

    return groupedAccounts;
  }, initialGroupedAccounts);
};
