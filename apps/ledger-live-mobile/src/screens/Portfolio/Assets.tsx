import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AssetRow from "../WalletCentricAsset/AssetRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

type ListProps = {
  assets: any;
};

const AssetsList = ({ assets }: ListProps) => {
  const navigation = useNavigation();
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <AssetRow asset={item} navigation={navigation} />
    ),
    [navigation],
  );

  return (
    <FlatList
      data={assets}
      renderItem={renderItem}
      keyExtractor={item => item?.currency?.id}
      contentContainerStyle={{ flex: 1 }}
    />
  );
};

export default withDiscreetMode(AssetsList);
