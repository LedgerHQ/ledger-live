import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useEvmStakingValidators } from "@ledgerhq/live-common/families/evm/staking/react";
import type { StakingValidatorItem } from "@ledgerhq/coin-evm/types/index";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { EvmDelegationFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import ValidatorRow from "./ValidatorRow";

type Props = StackNavigatorProps<
  EvmDelegationFlowParamList,
  ScreenName.EvmDelegationValidatorSelect
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);

  const [searchQuery, setSearchQuery] = useState("");

  const { validators } = useEvmStakingValidators(getAccountCurrency(account!).id, searchQuery);

  const onItemPress = useCallback(
    (validator: StakingValidatorItem) => {
      navigation.navigate(ScreenName.EvmDelegationValidatorSelect, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: StakingValidatorItem }) => (
      <ValidatorRow validator={item} onPress={onItemPress} />
    ),
    [onItemPress],
  );

  const keyExtractor = useCallback((v: StakingValidatorItem) => v.validatorAddress, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="EvmDelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="delegation"
        currency={ticker}
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
  list: {
    paddingHorizontal: 16,
  },
});
