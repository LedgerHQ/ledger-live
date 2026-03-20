import React from "react";
import { Asset } from "~/types/asset";
import { EMPTY_STATE_MAX_ASSETS } from "../hooks/usePortfolioCryptosSectionViewModel";
import AssetListItem from "./AssetListItem";
import { AssetListItemSkeleton } from "./AssetListItemSkeleton";
import { AssetsErrorState } from "./AssetsErrorState";

export type CryptoListContentProps = {
  isLoading: boolean;
  isError: boolean;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
};

export const CryptoListContent = ({
  isLoading,
  isError,
  assetsToDisplay,
  onItemPress,
}: CryptoListContentProps) => {
  if (isLoading) {
    return Array.from({ length: EMPTY_STATE_MAX_ASSETS }, (_, i) => (
      <AssetListItemSkeleton key={i} />
    ));
  }
  if (isError) {
    return <AssetsErrorState />;
  }
  return assetsToDisplay.map(item => (
    <AssetListItem key={item.currency.id} asset={item} onPress={onItemPress} />
  ));
};
