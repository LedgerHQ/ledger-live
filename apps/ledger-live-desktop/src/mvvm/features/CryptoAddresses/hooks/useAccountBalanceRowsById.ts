import { useMemo } from "react";
import { selectAccountBalances, type AccountAssetBalance } from "@domain/entity-account-balance";
import { useSelector } from "LLD/hooks/redux";
import type { AccountDataTarget } from "LLD/hooks/useAccountDataTargets";
import type { State } from "~/renderer/reducers";

export function useAccountBalanceRowsById(targets: readonly AccountDataTarget[]) {
  const accountBalances = useSelector((state: State) => state.accountBalances);

  return useMemo(() => {
    const byId = new Map<string, readonly AccountAssetBalance[] | undefined>();
    for (const target of targets)
      byId.set(target.account.id, selectAccountBalances({ accountBalances }, target.accountUUID));
    return byId;
  }, [accountBalances, targets]);
}
