import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HederaDelegationWithMeta } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import DelegationRow from "../shared/DelegationRow";
import type { HederaClaimRewardsFlowParamList } from "./types";

type Props = StackNavigatorProps<
  HederaClaimRewardsFlowParamList,
  ScreenName.HederaClaimRewardsSelectReward
>;

const keyExtractor = (d: HederaDelegationWithMeta) => d.nodeId.toString();

function ClaimRewardsSelectReward({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const onItemPress = useCallback(
    (delegationWithMeta: HederaDelegationWithMeta) => {
      navigation.navigate(ScreenName.HederaClaimRewardsClaim, {
        ...route.params,
        selectedDelegation: delegationWithMeta,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: HederaDelegationWithMeta }) => (
      <DelegationRow account={account} delegationWithMeta={item} onPress={onItemPress} />
    ),
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ClaimRewardsFlow"
        name="SelectReward"
        flow="stake"
        action="claimRewards"
        currency="hedera"
      />
      <FlatList
        contentContainerStyle={styles.list}
        data={[route.params.delegationWithMeta]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  list: {
    paddingHorizontal: 16,
  },
});

export default ClaimRewardsSelectReward;
