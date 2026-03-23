import React from "react";
import { Asset } from "~/types/asset";
import AssetListItem from "../PortfolioCryptosSection/components/AssetListItem";
import { AssetListItemSkeleton } from "../AssetListItemSkeleton";
import { AssetSectionErrorState } from "../AssetSectionErrorState";

export type AssetSectionListContentProps = {
  isLoading: boolean;
  isError: boolean;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
  skeletonCount: number;
  errorMessage: string;
};

export const AssetSectionListContent = ({
  isLoading,
  isError,
  assetsToDisplay,
  onItemPress,
  skeletonCount,
  errorMessage,
}: AssetSectionListContentProps) => {
  if (isLoading) {
    return Array.from({ length: skeletonCount }, (_, i) => <AssetListItemSkeleton key={i} />);
  }
  if (isError) {
    return <AssetSectionErrorState message={errorMessage} />;
  }
  return assetsToDisplay.map(item => (
    <AssetListItem key={item.currency.id} asset={item} onPress={onItemPress} />
  ));
};
