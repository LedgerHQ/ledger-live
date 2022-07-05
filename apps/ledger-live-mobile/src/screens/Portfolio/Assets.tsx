import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import { BalanceHistory } from "@ledgerhq/live-common/types/index";
import { useNavigation } from "@react-navigation/native";
import AccountRow from "../Accounts/AccountRow";
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
      <AccountRow
        navigation={navigation}
        account={item}
        accountId={item.id}
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
