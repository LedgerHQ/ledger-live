import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, View, SafeAreaView, ListRenderItem } from "react-native";
import { useSelector } from "react-redux";
import {
  CeloAccount,
  CeloValidatorGroup,
  CeloVote,
} from "@ledgerhq/live-common/families/celo/types";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import {
  activatableVotes,
  fallbackValidatorGroup,
} from "@ledgerhq/live-common/families/celo/logic";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import ValidatorHead from "../ValidatorHead";
import ValidatorRow from "../ValidatorRow";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CeloActivateFlowParamList } from "./types";

type Props = StackNavigatorProps<CeloActivateFlowParamList, ScreenName.CeloActivateValidatorSelect>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const votes = activatableVotes(account as CeloAccount);

  const { validatorGroups } = useCeloPreloadData();

  const mappedVotes = useMemo(
    () =>
      votes?.map(vote => ({
        vote,
        validatorGroup:
          validatorGroups.find(v => v.address === vote.validatorGroup) ||
          fallbackValidatorGroup(vote.validatorGroup),
      })) || [],
    [votes, validatorGroups],
  );

  const onItemPress = useCallback(
    (validator: CeloValidatorGroup) => {
      navigation.navigate(ScreenName.CeloActivateSummary, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem: ListRenderItem<{ vote: CeloVote; validatorGroup: CeloValidatorGroup }> =
    useCallback(
      ({ item }) => (
        <ValidatorRow
          account={account}
          validator={item.validatorGroup}
          vote={item.vote}
          onPress={onItemPress}
          amount={item.vote.amount}
        />
      ),
      [onItemPress, account],
    );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ActivateFlow"
        name="SelectValidator"
        flow="stake"
        action="activate"
        currency="celo"
      />
      <View style={styles.header}>
        <ValidatorHead />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={mappedVotes}
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
});

const keyExtractor = ({ validatorGroup }: { validatorGroup: CeloValidatorGroup }) =>
  validatorGroup.address;
