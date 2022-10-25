import React, { useCallback } from "react";
import { FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import ReadOnlyAccountRow from "../../Accounts/ReadOnly/ReadOnlyAccountRow";
import { withDiscreetMode } from "../../../context/DiscreetModeContext";
import { AccountsNavigatorParamList } from "../../../components/RootNavigator/types/AccountsNavigator";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";

type Navigation = StackNavigatorNavigation<
  AccountsNavigatorParamList,
  ScreenName.Accounts
>;

type ListProps = {
  assets: CryptoCurrency[];
};

const ReadOnlyAssetsList = ({ assets }: ListProps) => {
  const navigation = useNavigation<Navigation>();
  const renderItem = useCallback(
    ({ item }: { item: CryptoCurrency | TokenCurrency }) => (
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
