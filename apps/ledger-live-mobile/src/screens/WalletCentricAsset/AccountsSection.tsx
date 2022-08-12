import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import { BalanceHistory } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import AccountRow from "../Accounts/AccountRow";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

type ListProps = {
  accounts: any;
};

const AccountsSection = ({ accounts }: ListProps) => {
  const navigation = useNavigation();

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <AccountRow navigation={navigation} account={item} accountId={item.id} />
    ),
    [navigation],
  );

  return (
    <FlatList
      data={accounts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{ flex: 1 }}
    />
  );
};

export default withDiscreetMode(AccountsSection);
