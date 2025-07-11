import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { FlatList, StyleSheet } from "react-native";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import { accountScreenSelector } from "~/reducers/accounts";
import type { HederaRedelegationFlowParamList } from "./types";
import ValidatorRow from "../shared/ValidatorRow";

type Props = BaseComposite<
  StackNavigatorProps<HederaRedelegationFlowParamList, ScreenName.HederaRedelegationSelectValidator>
>;

const keyExtractor = (v: HederaValidator) => v.nodeId.toString();

export default function RedelegationSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const [searchQuery, setSearchQuery] = useState("");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const validators = useHederaValidators(account.currency, searchQuery);

  const onItemPress = useCallback(
    (validator: HederaValidator) => {
      navigation.navigate(ScreenName.HederaRedelegationAmount, {
        ...route.params,
        selectedValidator: validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: HederaValidator }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} />
    ),
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="RedelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="redelegation"
        currency="hedera"
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
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
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
