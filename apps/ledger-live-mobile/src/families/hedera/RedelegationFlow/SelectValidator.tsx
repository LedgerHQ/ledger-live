import React, { useCallback, useState } from "react";
import SafeAreaView from "~/components/SafeAreaView";
import { StyleSheet } from "react-native";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type { HederaRedelegationFlowParamList } from "./types";
import ValidatorsList from "../shared/ValidatorsList";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<HederaRedelegationFlowParamList, ScreenName.HederaRedelegationSelectValidator>
>;

export default function RedelegationSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const [searchQuery, setSearchQuery] = useState("");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const onItemPress = useCallback(
    (validator: HederaValidator) => {
      navigation.navigate(ScreenName.HederaRedelegationAmount, {
        ...route.params,
        selectedValidator: validator,
      });
    },
    [navigation, route.params],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="RedelegationFlow"
        name="SelectValidator"
        flow="stake"
        action={HEDERA_TRANSACTION_MODES.Redelegate}
        currency="hedera"
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <ValidatorsList account={account} searchQuery={searchQuery} onItemPress={onItemPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
