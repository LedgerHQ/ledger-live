/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useEvmStakingValidators } from "@ledgerhq/live-common/families/evm/staking/react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  canRedelegate,
  getUnbondingPeriodDays,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import {
  isStakingAccount,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { Alert, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import ValidatorHead from "~/families/cosmos/shared/ValidatorHead";
import ValidatorRow from "~/families/cosmos/shared/ValidatorRow";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type {
  StackNavigatorNavigation,
  StackNavigatorRoute,
} from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { EvmDelegationFlowParamList } from "./types";

export default function SelectRedelegationValidator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      StackNavigatorNavigation<EvmDelegationFlowParamList, ScreenName.EvmRedelegationValidator>
    >();
  const route =
    useRoute<
      StackNavigatorRoute<EvmDelegationFlowParamList, ScreenName.EvmRedelegationValidator>
    >();
  const { account } = useAccountScreen(route);
  const [searchQuery, setSearchQuery] = useState("");
  const evmNativeStakingFeature = useFeature("evmNativeStaking");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");
  invariant(isStakingAccount(account), "evm staking account required");

  const sourceDelegation = useMemo(
    () =>
      account.stakingResources.delegations.find(
        delegation => delegation.validatorAddress === route.params.validatorSrcAddress,
      ),
    [account.stakingResources.delegations, route.params.validatorSrcAddress],
  );
  const sourceValidator = useMemo(
    () =>
      account.stakingResources.validators?.find(
        validator => validator.validatorAddress === route.params.validatorSrcAddress,
      ),
    [account.stakingResources.validators, route.params.validatorSrcAddress],
  );

  const isFeatureEnabled =
    evmNativeStakingFeature?.enabled === true &&
    evmNativeStakingFeature.params?.supportedCurrencyIds?.includes(account.currency.id) === true;
  const canSourceRedelegate = !!sourceDelegation && canRedelegate(account, sourceDelegation);

  const bridge = useAccountBridge<GenericTransaction>(account);
  const { validators, loading, error } = useEvmStakingValidators(account.currency.id, searchQuery);
  const destinationValidators = useMemo(
    () =>
      validators.filter(
        validator => validator.validatorAddress !== route.params.validatorSrcAddress,
      ),
    [route.params.validatorSrcAddress, validators],
  );

  const onItemPress = useCallback(
    (validator: StakingValidatorItem) => {
      invariant(sourceDelegation, "source delegation required");
      const baseTransaction = bridge.createTransaction(account);
      navigation.navigate(ScreenName.EvmRedelegationAmount, {
        ...route.params,
        transaction: bridge.updateTransaction(baseTransaction, {
          mode: "redelegate",
          valAddress: sourceDelegation.validatorAddress,
          dstValAddress: validator.validatorAddress,
          amount: sourceDelegation.amount,
          recipient: account.freshAddress,
        }) as unknown as Transaction,
        validator,
        validatorSrc: sourceValidator,
      });
    },
    [account, bridge, navigation, route.params, sourceDelegation, sourceValidator],
  );

  const renderItem = useCallback(
    ({ item }: { item: StakingValidatorItem }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} />
    ),
    [account, onItemPress],
  );

  if (!isFeatureEnabled || !canSourceRedelegate) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="EvmRedelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="redelegation"
        currency={account.currency.ticker}
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <View style={styles.alertContainer}>
        <Alert
          type="info"
          title={t("ValidateOnDevice.infoWording.evm.redelegate", {
            numberOfDays: getUnbondingPeriodDays(account.currency.id) ?? 0,
          })}
        />
      </View>
      <View style={styles.header}>
        <ValidatorHead title={t("evm.redelegation.flow.steps.validator.validators")} />
      </View>
      {loading && destinationValidators.length === 0 ? (
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
          data={destinationValidators}
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
  alertContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
