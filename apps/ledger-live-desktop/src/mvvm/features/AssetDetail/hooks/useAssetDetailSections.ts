import { useMemo } from "react";
import type { DistributionItem } from "@ledgerhq/types-live";

export type AssetDetailSectionItem = {
  id: string;
  title: string;
  content: string;
  actionLabel?: string;
  actionHref?: string;
  tooltipContent?: string;
};

type AssetDetailSections = {
  topSections: [AssetDetailSectionItem, AssetDetailSectionItem];
  sections: AssetDetailSectionItem[];
  notFoundContent: string;
};

export function useAssetDetailSections(
  distributionItem: DistributionItem | undefined,
): AssetDetailSections {
  return useMemo(() => {
    return {
      topSections: [
        {
          id: "market-stats",
          title: "Market stats",
          content: "Placeholder market stats content",
          tooltipContent: "Market metrics and rankings for this asset.",
        },
        {
          id: "price-performance",
          title: "Price performance",
          content: "Placeholder performance metrics content",
          actionLabel: "Action",
          actionHref: "#",
        },
      ],
      sections: [],
      notFoundContent: distributionItem ? "" : "Asset distribution item not found.",
    };
  }, [distributionItem]);
}
