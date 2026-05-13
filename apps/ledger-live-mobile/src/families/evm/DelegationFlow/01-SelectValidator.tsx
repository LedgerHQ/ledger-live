/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useEvmStakingValidators } from "@ledgerhq/live-common/families/evm/staking/react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  isStakingAccount,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import ValidatorHead from "~/families/cosmos/shared/ValidatorHead";
import ValidatorRow from "~/families/cosmos/shared/ValidatorRow";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { EvmDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationValidator>;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  const [searchQuery, setSearchQuery] = useState("");
  const evmNativeStakingFeature = useFeature("evmNativeStaking");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");
  invariant(isStakingAccount(account), "evm staking account required");

  const isFeatureEnabled =
    evmNativeStakingFeature?.enabled === true &&
    evmNativeStakingFeature.params?.supportedCurrencyIds?.includes(account.currency.id) === true;

  const bridge = useAccountBridge<GenericTransaction>(account);
  const { validators, loading, error } = useEvmStakingValidators(account.currency.id, searchQuery);
  const baseTransaction = useMemo(() => {
    const transaction = bridge.createTransaction(account);
    return bridge.updateTransaction(transaction, {
      recipient: account.freshAddress,
    });
  }, [account, bridge]);

  const onItemPress = useCallback(
    (validator: StakingValidatorItem) => {
      navigation.navigate(ScreenName.EvmDelegationAmount, {
        ...route.params,
        transaction: bridge.updateTransaction(baseTransaction, {
          mode: "delegate",
          valAddress: validator.validatorAddress,
        }) as unknown as Transaction,
        validator,
      });
    },
    [baseTransaction, bridge, navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: StakingValidatorItem }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} />
    ),
    [account, onItemPress],
  );

  if (!isFeatureEnabled) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="EvmDelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="delegation"
        currency={account.currency.ticker}
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <View style={styles.header}>
        <ValidatorHead title={t("delegation.validator")} />
      </View>
      {loading && validators.length === 0 ? (
        <View style={styles.center}>
          <InfiniteLoader size={32} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text color="error.c50" textAlign="center">
            {error.message}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={validators}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const keyExtractor = (validator: StakingValidatorItem) => validator.validatorAddress;

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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
