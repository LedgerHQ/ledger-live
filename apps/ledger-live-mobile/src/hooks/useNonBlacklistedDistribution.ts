import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { useDistribution } from "~/actions/general";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { DistributionOpts } from "@ledgerhq/live-common/portfolio/index";

export function useNonBlacklistedDistribution(
  opts: DistributionOpts = { showEmptyAccounts: true },
) {
  return useNonBlacklistedDistributionResult(opts).list;
}

export function useNonBlacklistedDistributionResult(
  opts: DistributionOpts = { showEmptyAccounts: true },
) {
  const distribution = useDistribution(opts);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const list = useMemo(
    () =>
      distribution.isAvailable && distribution.countervalueComplete
        ? distribution.list.filter(
            ({ currency }) =>
              currency.type !== "TokenCurrency" || !blacklistedTokenIdsSet.has(currency.id),
          )
        : [],
    [
      distribution.isAvailable,
      distribution.countervalueComplete,
      distribution.list,
      blacklistedTokenIdsSet,
    ],
  );

  return useMemo(() => ({ ...distribution, list }), [distribution, list]);
}
