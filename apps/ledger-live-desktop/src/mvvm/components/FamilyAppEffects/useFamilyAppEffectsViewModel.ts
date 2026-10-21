import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getFamilyAppEffect } from "~/renderer/families";
import { accountsSelector } from "~/renderer/reducers/accounts";
import type { FamilyAppEffect, FamilyAppEffectsViewModel } from "./types";

export function useFamilyAppEffectsViewModel(): FamilyAppEffectsViewModel {
  const accounts = useSelector(accountsSelector);
  const effects = useMemo(
    () =>
      [...new Set(accounts.map(account => account.currency.family))]
        .sort((a, b) => a.localeCompare(b))
        .flatMap((family): FamilyAppEffect[] => {
          const AppEffect = getFamilyAppEffect(family);
          return AppEffect ? [{ family, AppEffect }] : [];
        }),
    [accounts],
  );
  return { effects };
}
