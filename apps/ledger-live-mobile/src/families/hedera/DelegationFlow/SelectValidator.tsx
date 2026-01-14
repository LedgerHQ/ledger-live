import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, StyleSheet, View } from "react-native";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type { HederaDelegationFlowParamList } from "./types";
import ValidatorRow from "../shared/ValidatorRow";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = BaseComposite<
  StackNavigatorProps<HederaDelegationFlowParamList, ScreenName.HederaDelegationSelectValidator>
>;

const keyExtractor = (v: HederaValidator) => v.nodeId.toString();

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const [searchQuery, setSearchQuery] = useState("");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const validators = useHederaValidators(account.currency, searchQuery);

  const onItemPress = useCallback(
    (validator: HederaValidator) => {
      navigation.navigate(ScreenName.HederaDelegationSummary, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    (data: { item: HederaValidator }) => (
      <ValidatorRow account={account} validator={data.item} onPress={onItemPress} />
    ),
    [onItemPress, account],
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

const ValidatorHead = () => (
  <View style={styles.validatorHead}>
    <Text style={styles.validatorHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
      <Trans i18nKey="delegation.validator" />
    </Text>
    <View style={styles.validatorHeadContainer}>
      <Text style={styles.validatorHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
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
  list: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  validatorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validatorHeadText: {
    fontSize: 14,
  },
  validatorHeadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
