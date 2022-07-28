import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { CryptoCurrency } from "@ledgerhq/live-common/types/index";
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
        screen="Assets"
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
