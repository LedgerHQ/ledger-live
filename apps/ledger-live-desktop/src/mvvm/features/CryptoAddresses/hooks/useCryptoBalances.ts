import { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  computeAggregatedAccountsData,
  type AggregatedAccountEntry,
  type CalculateCountervalue,
} from "@ledgerhq/asset-aggregation/index";
import { useAccountDataTargets, type AccountDataTarget } from "LLD/hooks/useAccountDataTargets";
import { USE_ACCOUNT_DATA_BALANCES } from "../constants";
import { useAccountBalanceRowsById } from "./useAccountBalanceRowsById";
import {
  computeAccountDataAggregatedAccounts,
  getAccountDataNativeBalance,
} from "../utils/accountDataBalances";

export type CryptoBalances = {
  targets: AccountDataTarget[];
  aggregatedDataByAccountId: Map<string, AggregatedAccountEntry>;
  isNativeBalanceZero: (account: Account) => boolean;
};

const isLegacyNativeBalanceZero = (account: Account) => account.balance.isZero();

function useAccountDataBalances(
  rows: AccountLike[],
  calculateCountervalue: CalculateCountervalue,
): CryptoBalances {
  const mainAccounts = useMemo(
    () => rows.filter((row): row is Account => row.type === "Account"),
    [rows],
  );
  const targets = useAccountDataTargets(mainAccounts);
  const rowsByAccountId = useAccountBalanceRowsById(targets);

  const aggregatedDataByAccountId = useMemo(
    () =>
      computeAccountDataAggregatedAccounts(mainAccounts, rowsByAccountId, calculateCountervalue),
    [mainAccounts, rowsByAccountId, calculateCountervalue],
  );

  const isNativeBalanceZero = useMemo(
    () => (account: Account) =>
      getAccountDataNativeBalance(account, rowsByAccountId.get(account.id)).isZero(),
    [rowsByAccountId],
  );

  return { targets, aggregatedDataByAccountId, isNativeBalanceZero };
}

function useLegacyBalances(
  rows: AccountLike[],
  calculateCountervalue: CalculateCountervalue,
): CryptoBalances {
  const aggregatedDataByAccountId = useMemo(
    () => computeAggregatedAccountsData(rows, calculateCountervalue),
    [rows, calculateCountervalue],
  );

  return { targets: [], aggregatedDataByAccountId, isNativeBalanceZero: isLegacyNativeBalanceZero };
}

/** The flag is a constant, so the same hook runs on every render. */
export const useCryptoBalances = USE_ACCOUNT_DATA_BALANCES
  ? useAccountDataBalances
  : useLegacyBalances;
