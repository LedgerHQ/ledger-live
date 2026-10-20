import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { FamilyAppEffectsViewModel } from "./types";

export function useFamilyAppEffectsViewModel(): FamilyAppEffectsViewModel {
  const accounts = useSelector(accountsSelector);
  const families = useMemo(
    () => [...new Set(accounts.map(account => account.currency.family))].sort(),
    [accounts],
  );
  return { families };
}
