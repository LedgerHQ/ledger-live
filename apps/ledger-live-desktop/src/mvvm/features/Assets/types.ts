import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";

export type AssetTableItem = CategorizedAssetItem & {
  isPlaceholder: boolean;
  placeholderPrice?: number;
  marketId?: string;
};

export type AssetsViewProps = {
  readonly isLoading: boolean;
  readonly sections: AssetSectionData[];
};

export type AssetSectionData = {
  readonly sectionId: string;
  readonly title: string;
  readonly items: AssetTableItem[];
  readonly totalCount: number;
  readonly onNavigate: () => void;
  readonly onItemClick: (item: AssetTableItem) => void;
};
