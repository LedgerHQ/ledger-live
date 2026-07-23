import React, { useCallback } from "react";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaEnrichedDelegation } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import DelegationRow from "../shared/DelegationRow";
import type { HederaClaimRewardsFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = StackNavigatorProps<
  HederaClaimRewardsFlowParamList,
  ScreenName.HederaClaimRewardsSelectReward
>;

function ClaimRewardsSelectReward({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account type must be Account");

  const onItemPress = useCallback(
    (enrichedDelegation: HederaEnrichedDelegation) => {
      navigation.navigate(ScreenName.HederaClaimRewardsClaim, {
        ...route.params,
        selectedDelegation: enrichedDelegation,
      });
    },
    [navigation, route.params],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ClaimRewardsFlow"
        name="SelectReward"
        flow="stake"
        action={HEDERA_TRANSACTION_MODES.ClaimRewards}
        currency="hedera"
      />
      <View style={styles.list}>
        <DelegationRow
          account={account}
          enrichedDelegation={route.params.enrichedDelegation}
          onPress={onItemPress}
        />
      </View>
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
