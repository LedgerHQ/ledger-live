import { useMemo } from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useParams } from "react-router";
import { useDistribution } from "~/renderer/actions/general";
import { decodeRouteParam } from "../utils/decodeRouteParam";

export type AssetDetailViewModel = {
  distributionItem: DistributionItem | undefined;
};

export function useAssetDetailViewModel(): AssetDetailViewModel {
  const { "*": routeAssetId } = useParams<{ "*": string }>();
  const distribution = useDistribution({ groupBy: "asset" });

  const distributionItem = useMemo(() => {
    if (!routeAssetId) return undefined;

    const decodedAssetId = decodeRouteParam(routeAssetId);

    return (
      distribution.bySlug?.[routeAssetId] ??
      distribution.bySlug?.[decodedAssetId] ??
      distribution.list.find(
        item => item.currency.id === routeAssetId || item.currency.id === decodedAssetId,
      )
    );
  }, [distribution.bySlug, distribution.list, routeAssetId]);

  return {
    distributionItem,
  };
}
