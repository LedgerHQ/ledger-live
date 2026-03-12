import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";

export type AssetsViewProps = {
  readonly isLoading: boolean;
  readonly sections: AssetSectionData[];
};

export type AssetSectionData = {
  readonly sectionId: string;
  readonly title: string;
  readonly items: CategorizedAssetItem[];
  readonly totalCount: number;
  readonly onNavigate: () => void;
  readonly onItemClick: (item: CategorizedAssetItem) => void;
};
