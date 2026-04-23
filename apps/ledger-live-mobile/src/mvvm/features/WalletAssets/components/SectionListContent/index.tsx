import React from "react";
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
};

const LIST_ITEM_STYLE = { marginHorizontal: "-s8", paddingVertical: "s4" } as const;

export const SectionListContent = ({
  isLoading,
  isError,
  assetsToDisplay,
  onItemPress,
  skeletonCount,
  errorMessage,
}: SectionListContentProps) => {
  const { precomputedData } = useSectionListContentViewModel(assetsToDisplay, isLoading || isError);

  if (isLoading) {
    return Array.from({ length: skeletonCount }, (_, i) => <ListItemSkeleton key={i} />);
  }
  if (isError) {
    return <SectionErrorState message={errorMessage} />;
  }
  return assetsToDisplay.map(item => (
    <AssetListItem
      key={item.currency.id}
      asset={item}
      onPress={onItemPress}
      precomputed={precomputedData.get(item.currency.id)!}
      lx={LIST_ITEM_STYLE}
      hideNetwork
    />
  ));
};
