import { useMemo } from "react";
import { useSelector } from "react-redux";
import BigNumber from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { usePortfolio as usePortfolioRaw } from "@ledgerhq/live-countervalues-react/portfolio";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import { freshBalancesSelector } from "~/renderer/selectors/freshBalances";

/**
 * Hook for fresh portfolio balance with proper countervalue conversion
 */
export function useFreshPortfolioBalance(): BigNumber {
  const accounts = useSelector(accountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const selectedRange = useSelector(selectedTimeRangeSelector);
  const freshBalances = useSelector(freshBalancesSelector);

  // Create virtual accounts with fresh balances
  const freshAccounts = useMemo(() => {
    return accounts.map(account => {
      const freshBalance = freshBalances[account.id];
      if (freshBalance) {
        // Create a virtual account with updated balance
        return {
          ...account,
          balance: freshBalance,
          // Also update subAccounts if any
          subAccounts: account.subAccounts?.map(subAccount => {
            const subFreshBalance = freshBalances[subAccount.id];
            return subFreshBalance ? { ...subAccount, balance: subFreshBalance } : subAccount;
          }),
        };
      }

      // Update subAccounts only if main account doesn't have fresh balance
      const updatedSubAccounts = account.subAccounts?.map(subAccount => {
        const subFreshBalance = freshBalances[subAccount.id];
        return subFreshBalance ? { ...subAccount, balance: subFreshBalance } : subAccount;
      });

      return updatedSubAccounts && updatedSubAccounts !== account.subAccounts
        ? { ...account, subAccounts: updatedSubAccounts }
        : account;
    });
  }, [accounts, freshBalances]);

  // Use the official portfolio calculation with fresh accounts
  const freshPortfolio = usePortfolioRaw({
    accounts: freshAccounts,
    range: selectedRange,
    to: counterValueCurrency,
  });

  return useMemo(() => {
    const latestBalance = freshPortfolio.balanceHistory[freshPortfolio.balanceHistory.length - 1];
    return new BigNumber(latestBalance?.value || 0);
  }, [freshPortfolio.balanceHistory]);
}

/**
 * Hook to check if any accounts have fresh balances
 */
export function useHasFreshBalances(): boolean {
  const freshBalances = useSelector(freshBalancesSelector);
  return Object.keys(freshBalances).length > 0;
}

/**
 * Hook for fresh portfolio stats
 */
export function useFreshPortfolioStats() {
  const accounts = useSelector(accountsSelector);
  const freshBalances = useSelector(freshBalancesSelector);

  const flattenedAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);

  return useMemo(() => {
    const totalAccounts = flattenedAccounts.length;
    const freshAccounts = flattenedAccounts.filter(account => freshBalances[account.id]).length;

    return {
      totalAccounts,
      freshAccounts,
      freshPercentage: totalAccounts > 0 ? (freshAccounts / totalAccounts) * 100 : 0,
    };
  }, [flattenedAccounts, freshBalances]);
}
