import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { useDistribution } from "~/actions/general";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import { DistributionOptions } from "~/types/distributionOptions";

export function useNonBlacklistedDistribution(
  opts: DistributionOptions = { showEmptyAccounts: true },
) {
  const distribution = useDistribution(opts);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  return useMemo(
    () =>
      distribution.isAvailable
        ? distribution.list.filter(
            ({ currency }) =>
              currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
          )
        : [],
    [distribution.isAvailable, distribution.list, blacklistedTokenIdsSet],
  );
}
