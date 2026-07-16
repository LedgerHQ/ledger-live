import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Asset } from "~/types/asset";
import AssetListItem from "LLM/components/AssetListItem";
import { ListItemSkeleton } from "../ListItemSkeleton";
import { SectionErrorState } from "../SectionErrorState";
import { useSectionListContentViewModel } from "./useSectionListContentViewModel";

export type SectionListContentProps = {
  isLoading: boolean;
  isError: boolean;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
  skeletonCount: number;
  errorMessage: string;
  /**
   * Section-scoped prefix used to tag each rendered row with a `${rowTestIDPrefix}-item-${index}`
   * testID, so e2e can count rows per section (the shared `assetItem-${name}` id can't be scoped).
   */
  rowTestIDPrefix?: string;
};

const NEGATIVE_MARGIN_OFFSET = { marginHorizontal: "-s8" } as const;

export const SectionListContent = ({
  isLoading,
  isError,
  assetsToDisplay,
  onItemPress,
  skeletonCount,
  errorMessage,
  rowTestIDPrefix,
}: SectionListContentProps) => {
  const { precomputedData } = useSectionListContentViewModel(assetsToDisplay, isLoading || isError);

  if (isLoading) {
    return Array.from({ length: skeletonCount }, (_, i) => <ListItemSkeleton key={i} />);
  }
  if (isError) {
    return <SectionErrorState message={errorMessage} />;
  }
  return assetsToDisplay.map((item, index) => (
    <Box
      key={item.currency.id}
      testID={rowTestIDPrefix ? `${rowTestIDPrefix}-item-${index}` : undefined}
    >
      <AssetListItem
        asset={item}
        onPress={onItemPress}
        precomputed={precomputedData.get(item.currency.id)!}
        lx={NEGATIVE_MARGIN_OFFSET}
        hideNetwork
      />
    </Box>
  ));
};
