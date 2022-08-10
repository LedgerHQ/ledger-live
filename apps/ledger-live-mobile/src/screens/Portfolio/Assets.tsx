import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import { BalanceHistory } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import AssetRow from "../WalletCentricAsset/AssetRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

type ListProps = {
  balanceHistory: BalanceHistory;
  assets: any;
};

const AssetsList = ({ balanceHistory, assets }: ListProps) => {
  const navigation = useNavigation();
  const portfolioValue = useMemo(
    () => balanceHistory[balanceHistory.length - 1].value,
    [balanceHistory],
  );
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <AssetRow
        navigation={navigation}
        asset={item}
        assetId={item.id}
        portfolioValue={portfolioValue}
      />
    ),
    [navigation, portfolioValue],
  );

  return (
    <FlatList
      data={assets}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{ flex: 1 }}
    />
  );
};

export default withDiscreetMode(AssetsList);
