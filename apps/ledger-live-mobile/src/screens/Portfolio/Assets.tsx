import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { isEqual } from "lodash";
import AssetRow, { NavigationProp } from "../WalletCentricAsset/AssetRow";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { Asset } from "~/types/asset";
import { ScreenName } from "~/const";

type ListProps = { assets: Asset[] };

const AssetsList = ({ assets }: ListProps) => {
  const navigation = useNavigation<NavigationProp>();
  const renderItem = useCallback(
    ({ item }: { item: Asset }) => (
      <AssetRow asset={item} navigation={navigation} sourceScreenName={ScreenName.Portfolio} />
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

export default React.memo(withDiscreetMode(AssetsList), isEqual);
