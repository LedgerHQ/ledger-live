import React, { useCallback } from "react";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { AssetRow } from "../AssetRow";
import { AssetRowSkeleton } from "../AssetRowSkeleton";
import type { GlobalSearchCategory } from "../../useGlobalSearchViewModel";

type Props = Readonly<{
  title: string;
  testID?: string;
  assets: MarketAssetDisplayData[];
  isLoading: boolean;
  skeletonCount: number;
  category: GlobalSearchCategory;
  onSeeAll: (category: GlobalSearchCategory) => void;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
}>;

export function AssetRowsSection({
  title,
  testID,
  assets,
  isLoading,
  skeletonCount,
  category,
  onSeeAll,
  onAssetPress,
}: Props) {
  const handleSeeAll = useCallback(() => onSeeAll(category), [onSeeAll, category]);

  if (!isLoading && assets.length === 0) return null;

  return (
    <Box lx={sectionStyle} testID={testID}>
      <Subheader>
        <SubheaderRow
          onPress={handleSeeAll}
          accessibilityRole="button"
          testID={testID ? `${testID}-header` : undefined}
        >
          <SubheaderTitle>{title}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      <Box>
        {isLoading
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <AssetRowSkeleton key={index} testID="global-search-asset-skeleton" />
            ))
          : assets.map(asset => (
              <AssetRow key={asset.id} market={asset} onPress={onAssetPress} lx={rowStyle} />
            ))}
      </Box>
    </Box>
  );
}

const sectionStyle: LumenViewStyle = { gap: "s4" };
const rowStyle: LumenViewStyle = { marginHorizontal: "-s8" };
