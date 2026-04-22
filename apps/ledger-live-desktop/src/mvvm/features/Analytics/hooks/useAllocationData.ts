import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  hideEmptyTokenAccountsSelector,
  blacklistedTokenIdsSelector,
} from "~/renderer/reducers/settings";
import { useDistribution } from "~/renderer/actions/general";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/index";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import type { AllocationTableItem, AllocationViewProps } from "../types";

const PAGE_SIZE = 6;

export function useAllocationData(): AllocationViewProps {
  const navigate = useNavigate();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const distribution = useDistribution({
    hideEmptyTokenAccount,
    groupBy: shouldDisplayAggregatedAssets ? "asset" : undefined,
  });

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allItems: AllocationTableItem[] = useMemo(
    () =>
      distribution.list
        .filter(item => !blacklistedTokenIds.includes(item.currency.id))
        .map(item => ({
          currency: item.currency,
          balance: item.amount,
          distribution: Math.floor((item.distribution ?? 0) * 10000) / 100,
        })),
    [distribution.list, blacklistedTokenIds],
  );

  const items = useMemo(() => allItems.slice(0, visibleCount), [allItems, visibleCount]);
  const hasMore = visibleCount < allItems.length;

  const showMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  }, []);

  const onItemClick = useCallback(
    (item: AllocationTableItem) => {
      setTrackingSource("asset allocation");
      navigate(`/asset/${item.currency.id}`);
    },
    [navigate],
  );

  return { items, hasMore, showMore, onItemClick };
}
