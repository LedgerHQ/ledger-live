import { useCallback } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import {
  BaseRawDetailedAccount,
  ExtendedRawDetailedAccount,
  CreateDetailedAccountsParams,
} from "../types/detailedAccount";
import { sortAccountsByFiatValue } from "../utils/sortAccountsByFiatValue";

/**
 * Core hook for creating detailed accounts with shared logic
 * This contains the business logic that can be reused across platforms
 */
export function useDetailedAccountsCore(
  counterValuesState: CounterValuesState,
  counterValueCurrency: Currency,
) {
  /**
   * Calculate fiat value for an account using counter values
   */
  const calculateFiatValue = useCallback(
    (account: AccountLike): number => {
      const currency = account.type === "Account" ? account.currency : account.token;
      const fiatValue = calculate(counterValuesState, {
        from: currency,
        to: counterValueCurrency,
        value: account.balance.toNumber(),
      });
      return fiatValue || 0;
    },
    [counterValuesState, counterValueCurrency],
  );

  /**
   * Create base detailed accounts from account tuples
   * This is the core transformation logic shared between platforms
   */
  const createBaseDetailedAccounts = useCallback(
    (params: CreateDetailedAccountsParams): BaseRawDetailedAccount[] => {
      const { accountTuples, accountNameMap, isTokenCurrency } = params;

      const baseAccounts = accountTuples.map(tuple => {
        const { account, subAccount } = tuple;
        const address = account.freshAddress;

        if (isTokenCurrency && subAccount) {
          const parentAccountName = accountNameMap[account.id];
          const details = subAccount.token;

          return {
            id: subAccount.id,
            name: parentAccountName ?? details.name,
            ticker: details.ticker,
            balance: subAccount.balance,
            balanceUnit: subAccount.token.units[0],
            fiatValue: calculateFiatValue(subAccount),
            address,
            cryptoId: details.id,
            parentId: details.parentCurrency.id,
          };
        } else {
          const accountName = accountNameMap[account.id];
          const details = account.currency;

          return {
            id: account.id,
            name: accountName ?? details.name,
            ticker: details.ticker,
            balance: account.balance,
            balanceUnit: account.currency.units[0],
            fiatValue: calculateFiatValue(account),
            address,
            cryptoId: details.id,
          };
        }
      });

      return sortAccountsByFiatValue(baseAccounts);
    },
    [calculateFiatValue],
  );

  /**
   * Create extended detailed accounts that include account references
   * Used by mobile implementation that needs access to the full account objects
   */
  const createExtendedDetailedAccounts = useCallback(
    (params: CreateDetailedAccountsParams): ExtendedRawDetailedAccount[] => {
      const { accountTuples, accountNameMap, isTokenCurrency } = params;

      const extendedAccounts = accountTuples.map(tuple => {
        const { account, subAccount } = tuple;
        const protocol = getTagDerivationMode(account.currency, account.derivationMode) ?? "";
        const address = account.freshAddress;

        if (isTokenCurrency && subAccount) {
          const parentAccountName = accountNameMap[account.id];
          const details = subAccount.token;

          return {
            id: subAccount.id,
            name: parentAccountName ?? details.name,
            ticker: details.ticker,
            balance: subAccount.balance,
            balanceUnit: subAccount.token.units[0],
            fiatValue: calculateFiatValue(subAccount),
            address,
            cryptoId: details.id,
            parentId: details.parentCurrency.id,
            account: subAccount,
            parentAccount: account,
          };
        } else {
          const accountName = accountNameMap[account.id];
          const details = account.currency;

          return {
            id: account.id,
            name: accountName ?? details.name,
            ticker: details.ticker,
            balance: account.balance,
            balanceUnit: account.currency.units[0],
            fiatValue: calculateFiatValue(account),
            address,
            cryptoId: details.id,
            account,
            protocol,
          };
        }
      });

      return sortAccountsByFiatValue(extendedAccounts);
    },
    [calculateFiatValue],
  );

  return {
    calculateFiatValue,
    createBaseDetailedAccounts,
    createExtendedDetailedAccounts,
  };
}
