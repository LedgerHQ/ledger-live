import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, View, SafeAreaView, ListRenderItem } from "react-native";
import { useSelector } from "react-redux";
import { CeloValidatorGroup } from "@ledgerhq/live-common/families/celo/types";
import { useValidatorGroups } from "@ledgerhq/live-common/families/celo/react";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import ValidatorHead from "../ValidatorHead";
import ValidatorRow from "../ValidatorRow";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { CeloVoteFlowParamList } from "./types";

type Props = StackNavigatorProps<CeloVoteFlowParamList, ScreenName.CeloVoteValidatorSelect>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const [searchQuery, setSearchQuery] = useState("");

  const validators = useValidatorGroups(searchQuery);

  const onItemPress = useCallback(
    (validator: CeloValidatorGroup) => {
      navigation.navigate(ScreenName.CeloVoteSummary, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem: ListRenderItem<CeloValidatorGroup> = useCallback(
    ({ item }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} amount={item.votes} />
    ),
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="VoteFlow"
        name="SelectValidator"
        flow="stake"
        action="vote"
        currency="celo"
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

const keyExtractor = (v: CeloValidatorGroup) => v.address;
