import React, { useCallback } from "react";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Asset } from "~/types/asset";
import AssetListItem from "LLM/components/AssetListItem";

const HORIZONTAL_PADDING = 8;

interface CryptoAssetListProps {
  assets: Asset[];
  onItemPress: (asset: Asset) => void;
}

export const CryptoAssetList: React.FC<CryptoAssetListProps> = ({ assets, onItemPress }) => {
  const { bottom } = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Asset>) => <AssetListItem asset={item} onPress={onItemPress} />,
    [onItemPress],
  );

  return (
    <FlashList
      testID="CryptoList"
      renderItem={renderItem}
      data={assets}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: bottom }}
      style={{ flex: 1 }}
    />
  );
};
