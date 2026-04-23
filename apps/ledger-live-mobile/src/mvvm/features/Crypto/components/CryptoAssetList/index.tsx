import React, { useCallback } from "react";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Asset } from "~/types/asset";
import AssetListItem from "LLM/components/AssetListItem";
import { usePrecomputedAssetListData } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
import { useCryptoAssetListViewModel } from "./useCryptoAssetListViewModel";

const ESTIMATED_ITEM_SIZE = 72;
const DRAW_DISTANCE = ESTIMATED_ITEM_SIZE * 5;
const FLEX_STYLE = { flex: 1 } as const;
const keyExtractor = (item: Asset) => item.currency.id;

interface CryptoAssetListProps {
  assets: Asset[];
  onItemPress: (asset: Asset) => void;
}

export const CryptoAssetList: React.FC<CryptoAssetListProps> = ({ assets, onItemPress }) => {
  const { contentContainerStyle } = useCryptoAssetListViewModel();
  const precomputedData = usePrecomputedAssetListData(assets);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Asset>) => (
      <AssetListItem
        asset={item}
        onPress={onItemPress}
        precomputed={precomputedData.get(item.currency.id)!}
      />
    ),
    [onItemPress, precomputedData],
  );

  return (
    <FlashList
      testID="CryptoList"
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      data={assets}
      drawDistance={DRAW_DISTANCE}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      style={FLEX_STYLE}
    />
  );
};
