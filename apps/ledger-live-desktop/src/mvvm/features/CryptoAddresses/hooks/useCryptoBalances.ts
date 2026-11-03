import { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import {
  computeAggregatedAccountsData,
  type AggregatedAccountEntry,
  type CalculateCountervalue,
} from "@ledgerhq/asset-aggregation/index";
import { useSelector } from "LLD/hooks/redux";
import { useAccountDataTargets, type AccountDataTarget } from "LLD/hooks/useAccountDataTargets";
import type { State } from "~/renderer/reducers";
import { USE_ACCOUNT_DATA_BALANCES } from "../constants";
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
  const accountBalances = useSelector((state: State) => state.accountBalances);

  const rowsByAccountId = useMemo(() => {
    const byId = new Map<string, readonly AccountAssetBalance[] | undefined>();
    for (const target of targets) byId.set(target.account.id, accountBalances[target.accountUUID]);
    return byId;
  }, [accountBalances, targets]);

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
