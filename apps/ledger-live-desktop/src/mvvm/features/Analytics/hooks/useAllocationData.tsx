import { AllocationTableItem } from "../types";
import { useSelector } from "LLD/hooks/redux";
import {
  hideEmptyTokenAccountsSelector,
  blacklistedTokenIdsSelector,
} from "~/renderer/reducers/settings";
import { useDistribution } from "~/renderer/actions/general";
import { useMemo } from "react";

export function useAllocationData() {
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const distribution = useDistribution({ hideEmptyTokenAccount });

  const filtered = distribution.list.filter(
    item => !blacklistedTokenIds.includes(item.currency.id),
  );

  const listKey = filtered
    .map(i => `${i.currency.id}:${i.amount}:${i.countervalue}:${i.distribution}`)
    .join(",");

  const items: AllocationTableItem[] = useMemo(
    () =>
      filtered.map(item => ({
        currency: item.currency,
        balance: item.amount,
        value: item.countervalue,
        distribution: Math.floor((item.distribution ?? 0) * 10000) / 100,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listKey],
  );

  return { items, totalCount: items.length };
}
