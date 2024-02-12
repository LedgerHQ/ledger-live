import { useLedgerFirstShuffledValidatorsCosmosFamily } from "@ledgerhq/live-common/families/cosmos/react";
import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import ValidatorHead from "../shared/ValidatorHead";
import ValidatorRow from "../shared/ValidatorRow";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CosmosDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  CosmosDelegationFlowParamList,
  ScreenName.CosmosDelegationValidatorSelect
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { ticker } = getAccountCurrency(account);

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const [searchQuery, setSearchQuery] = useState("");

  const validators = useLedgerFirstShuffledValidatorsCosmosFamily(account.currency.id, searchQuery);

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
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="delegation"
        currency={ticker}
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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
