import { useMemo } from "react";
import { CountervalueTickerSchema, type CountervalueTicker } from "@domain/entity-account-balance";
import {
  selectAccountBalanceHistory,
  type AssetBalanceHistory,
} from "@domain/entity-account-balance-history";
import { useCalculateCountervalueCallback } from "~/renderer/actions/general";
import { USE_ACCOUNT_DATA_BALANCES } from "LLD/features/CryptoAddresses/constants";
import { useAccountBalanceRowsById } from "LLD/features/CryptoAddresses/hooks/useAccountBalanceRowsById";
import { computeAccountDataAggregatedEntry } from "LLD/features/CryptoAddresses/utils/accountDataBalances";
import { filterAccountsExcludingBlacklisted } from "@ledgerhq/live-common/account/filterAccountsExcludingBlacklisted";
import type { Account, PortfolioRange } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useAccountDataTargets, type AccountDataTarget } from "LLD/hooks/useAccountDataTargets";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  blacklistedTokenIdsSelector,
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import type { State } from "~/renderer/reducers";
import { DEFAULT_PORTFOLIO_RANGE } from "LLD/utils/constants";
import { USE_ACCOUNT_DATA_BALANCE_HISTORY } from "../constants";
import {
  balanceHistoryValueChange,
  type BalanceHistoryValueChange,
} from "../utils/balanceHistoryValueChange";

export type BalanceHistoryRead = {
  targets: AccountDataTarget[];
  accountCount: number;
  range: PortfolioRange;
  countervalue: CountervalueTicker;
};

function useVisibleRootAccounts(): Account[] {
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  return useMemo(() => {
    const visible =
      (blacklistedTokenIds?.length ?? 0) > 0
        ? filterAccountsExcludingBlacklisted(accounts, blacklistedTokenIds)
        : accounts;
    return visible.filter((account): account is Account => account.type === "Account");
  }, [accounts, blacklistedTokenIds]);
}

export function useBalanceHistoryRead(legacyRange: boolean): BalanceHistoryRead | undefined {
  const accounts = useVisibleRootAccounts();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const range = legacyRange ? selectedTimeRange : DEFAULT_PORTFOLIO_RANGE;
  const parsedTicker = CountervalueTickerSchema.safeParse(counterValue.ticker);
  const countervalue = parsedTicker.success ? parsedTicker.data : undefined;
  const targets = useAccountDataTargets(accounts);

  return useMemo(() => {
    if (!USE_ACCOUNT_DATA_BALANCE_HISTORY || !countervalue) return undefined;
    return { targets, accountCount: accounts.length, range, countervalue };
  }, [accounts, countervalue, range, targets]);
}

export function useCurrentPortfolioWorth(): number | undefined {
  const accounts = useVisibleRootAccounts();
  const targets = useAccountDataTargets(accounts);
  const rowsByAccountId = useAccountBalanceRowsById(targets);
  const calculateCountervalue = useCalculateCountervalueCallback();

  return useMemo(() => {
    if (!USE_ACCOUNT_DATA_BALANCES || accounts.length === 0) return undefined;
    return accounts.reduce((sum, account) => {
      const worth = computeAccountDataAggregatedEntry(
        account,
        rowsByAccountId.get(account.id),
        calculateCountervalue,
      ).countervalue;
      return sum + worth.toNumber();
    }, 0);
  }, [accounts, calculateCountervalue, rowsByAccountId]);
}

export function useAccountDataPortfolioHistory(
  legacyRange: boolean,
): BalanceHistoryValueChange | undefined {
  const read = useBalanceHistoryRead(legacyRange);

  return useSelector((state: State) => {
    if (!read || read.accountCount === 0 || read.targets.length !== read.accountCount) {
      return undefined;
    }

    const perAccount: AssetBalanceHistory[][] = [];
    for (const target of read.targets) {
      const series = selectAccountBalanceHistory(
        state,
        target.accountUUID,
        read.range,
        read.countervalue,
      );
      if (!series) return undefined;
      perAccount.push(series);
    }

    return balanceHistoryValueChange(perAccount, read.countervalue);
  });
}
