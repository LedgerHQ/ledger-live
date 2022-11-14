import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AssetRow, { NavigationProp } from "../WalletCentricAsset/AssetRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import { Asset } from "../../types/asset";

type ListProps = { assets: Asset[] };

const AssetsList = ({ assets }: ListProps) => {
  const navigation = useNavigation<NavigationProp>();
  const renderItem = useCallback(
    ({ item }: { item: Asset }) => (
      <AssetRow asset={item} navigation={navigation} />
    ),
    [navigation],
  );

  return (
    <FlatList<Asset>
      data={assets}
      renderItem={renderItem}
      keyExtractor={item => item.currency.id}
      contentContainerStyle={{ flex: 1 }}
    />
  );
};

export default withDiscreetMode(AssetsList);
