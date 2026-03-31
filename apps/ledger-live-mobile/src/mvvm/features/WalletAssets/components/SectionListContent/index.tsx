import React from "react";
import { Asset } from "~/types/asset";
import ListItem from "../ListItem";
import { ListItemSkeleton } from "../ListItemSkeleton";
import { SectionErrorState } from "../SectionErrorState";

export type SectionListContentProps = {
  isLoading: boolean;
  isError: boolean;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
  skeletonCount: number;
  errorMessage: string;
};

export const SectionListContent = ({
  isLoading,
  isError,
  assetsToDisplay,
  onItemPress,
  skeletonCount,
  errorMessage,
}: SectionListContentProps) => {
  if (isLoading) {
    return Array.from({ length: skeletonCount }, (_, i) => <ListItemSkeleton key={i} />);
  }
  if (isError) {
    return <SectionErrorState message={errorMessage} />;
  }
  return assetsToDisplay.map(item => (
    <ListItem key={item.currency.id} asset={item} onPress={onItemPress} />
  ));
};
