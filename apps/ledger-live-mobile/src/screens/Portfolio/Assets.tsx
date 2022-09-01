import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import AssetRow, { NavigationProp } from "../WalletCentricAsset/AssetRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

export type Asset = {
  currency: CryptoCurrency | TokenCurrency;
  accounts: AccountLike[];
  distribution?: number;
  amount: number;
  countervalue?: number;
};

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
    <FlatList
      data={assets}
      renderItem={renderItem}
      keyExtractor={item => item?.currency?.id}
      contentContainerStyle={{ flex: 1 }}
    />
  );
};

export default withDiscreetMode(AssetsList);
