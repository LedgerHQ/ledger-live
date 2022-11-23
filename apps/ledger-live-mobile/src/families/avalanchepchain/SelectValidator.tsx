import { useAvalancheFilteredValidators } from "@ledgerhq/live-common/families/avalanchepchain/react";
import { AvalanchePChainValidator } from "@ledgerhq/live-common/families/avalanchepchain/types";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import ValidatorHead from "./ValidatorHead";
import ValidatorRow from "./ValidatorRow";
import SelectValidatorSearchBox from "../tron/VoteFlow/01-SelectValidator/SearchBox";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { AvalancheDelegationFlowParamList } from "./DelegationFlow/types";

type Props = StackNavigatorProps<
  AvalancheDelegationFlowParamList,
  ScreenName.AvalancheDelegationValidatorSelect
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const [searchQuery, setSearchQuery] = useState("");

  const validators = useAvalancheFilteredValidators(searchQuery);

  const onItemPress = useCallback(
    (validator: AvalanchePChainValidator) => {
      navigation.navigate(ScreenName.AvalancheDelegationValidator, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: AvalanchePChainValidator }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} />
    ),
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="DelegationFlow" name="SelectValidator" />
      <SelectValidatorSearchBox
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
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

const keyExtractor = (v: AvalanchePChainValidator) => v.nodeID;
