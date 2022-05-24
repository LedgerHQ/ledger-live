import { useLedgerFirstShuffledValidatorsCosmos } from "@ledgerhq/live-common/lib/families/cosmos/react";
import { CosmosValidatorItem } from "@ledgerhq/live-common/lib/families/cosmos/types";
import { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";
import ValidatorHead from "../shared/ValidatorHead";
import ValidatorRow from "../shared/ValidatorRow";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
  validator?: CosmosValidatorItem;
};

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const validators = useLedgerFirstShuffledValidatorsCosmos();

  const onItemPress = useCallback(
    (validator: CosmosValidatorItem) => {
      navigation.navigate(ScreenName.CosmosDelegationValidator, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: CosmosValidatorItem }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} />
    ),
    [onItemPress],
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <TrackScreen category="DelegationFlow" name="SelectValidator" />
      <View style={styles.header}>
        <ValidatorHead />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={validators}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  footer: {
    padding: 16,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  overdelegatedIndicator: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
  },
  validatorYield: {
    fontSize: 14,
  },
  validatorYieldFull: {
    opacity: 0.5,
  },
  warningBox: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  providedByContainer: {
    display: "flex",
    flexDirection: "row",
  },
  providedByText: {
    fontSize: 14,
    marginRight: 5,
  },
  infoModalContainerStyle: {
    alignSelf: "stretch",
  },
});

const keyExtractor = (v: CosmosValidatorItem) => v.validatorAddress;
