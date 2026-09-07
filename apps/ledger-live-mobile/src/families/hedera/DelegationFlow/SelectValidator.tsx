import React, { useCallback, useState } from "react";
import { Trans } from "~/context/Locale";
import SafeAreaView from "~/components/SafeAreaView";
import { StyleSheet, View } from "react-native";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type { HederaDelegationFlowParamList } from "./types";
import ValidatorsList from "../shared/ValidatorsList";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<HederaDelegationFlowParamList, ScreenName.HederaDelegationSelectValidator>
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const [searchQuery, setSearchQuery] = useState("");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const onItemPress = useCallback(
    (validator: HederaValidator) => {
      navigation.navigate(ScreenName.HederaDelegationSummary, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="SelectValidator"
        flow="stake"
        action={HEDERA_TRANSACTION_MODES.Delegate}
        currency="hedera"
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <ValidatorsList
        account={account}
        searchQuery={searchQuery}
        onItemPress={onItemPress}
        header={
          <View style={styles.header}>
            <ValidatorHead />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const ValidatorHead = () => (
  <View style={styles.validatorHead}>
    <Text typography="body2SemiBold" lx={{ color: "muted" }} numberOfLines={1}>
      <Trans i18nKey="delegation.validator" />
    </Text>
    <View style={styles.validatorHeadContainer}>
      <Text typography="body2SemiBold" lx={{ color: "muted" }} numberOfLines={1}>
        <Trans i18nKey="hedera.delegation.steps.validator.totalStake" />
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  validatorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validatorHeadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
