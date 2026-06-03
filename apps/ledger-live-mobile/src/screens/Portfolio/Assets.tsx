import React, { useCallback } from "react";
import { FlatList, type ListRenderItem } from "react-native";
import isEqual from "lodash/isEqual";
import AssetRow from "../WalletCentricAsset/AssetRow";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { Asset } from "~/types/asset";

type ListProps = { assets: Asset[] };

const AssetsList = ({ assets }: ListProps) => {
  const renderItem = useCallback<ListRenderItem<Asset>>(
    ({ item }) => <AssetRow asset={item} />,
    [],
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
