import React, { useCallback } from "react";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { Asset } from "~/types/asset";
import { LazyAssetListItem } from "LLM/components/AssetListItem";
import { AssetListSharedStateContext } from "LLM/components/AssetListItem/usePrecomputedAssetListData";
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
  const { sharedState, contentContainerStyle } = useCryptoAssetListViewModel();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Asset>) => (
      <LazyAssetListItem asset={item} onPress={onItemPress} />
    ),
    [onItemPress],
  );

  return (
    <AssetListSharedStateContext.Provider value={sharedState}>
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
    </AssetListSharedStateContext.Provider>
  );
};
