/* @flow */
import invariant from "invariant";
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import SettingsRow from "../../components/SettingsRow";
import Touchable from "../../components/Touchable";
import NavigationScrollView from "../../components/NavigationScrollView";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
};

export default function EditAccountUnits({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account?.type === "Account", "account must be a main account");

  const onPressItem = useCallback(
    (item: any) => {
      const newAccount = {
        ...account,
        unit: item,
      };
      dispatch(updateAccount(newAccount));
      navigation.goBack();
    },
    [account, navigation, dispatch],
  );

  const accountUnits = account.currency.units;

  return (
    <NavigationScrollView>
      <View style={styles.body}>
        <FlatList
          data={accountUnits}
          keyExtractor={(item: any) => item.code}
          renderItem={({ item }) => (
            <Touchable
              event="EditAccountUnits"
              eventProperties={{
                currency: account.currency.id,
                unit: item.code,
              }}
              onPress={() => {
                onPressItem(item);
              }}
            >
              <SettingsRow
                title={item.code}
                selected={account.unit.code === item.code}
                compact
              />
            </Touchable>
          )}
        >
          {account.unit.code}
        </FlatList>
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  body: {
    flexDirection: "column",
    flex: 1,
    padding: 16,
  },
});
