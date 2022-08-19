import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import ReadOnlyAccountRow from "../../Accounts/ReadOnly/ReadOnlyAccountRow";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";

type ListProps = {
  assets: CryptoCurrency[];
};

const ReadOnlyAssetsList = ({ assets }: ListProps) => {
  const navigation = useNavigation();
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ReadOnlyAccountRow
        navigation={navigation}
        currency={item}
        screen="Wallet"
      />
    ),
    [navigation],
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

export default withDiscreetMode(ReadOnlyAssetsList);
