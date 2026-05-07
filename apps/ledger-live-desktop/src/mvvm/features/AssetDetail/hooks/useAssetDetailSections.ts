import { useMemo, type ReactNode } from "react";

export type AssetDetailSectionItem = {
  id: string;
  title: string;
  content: ReactNode;
  actionLabel?: string;
  onActionClick?: () => void;
  tooltipContent?: string;
};

type AssetDetailSections = {
  topSections: [AssetDetailSectionItem, AssetDetailSectionItem];
  sections: AssetDetailSectionItem[];
};

export function useAssetDetailSections(): AssetDetailSections {
  return useMemo(
    () => ({
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
        },
      ],
      sections: [],
    }),
    [],
  );
}
