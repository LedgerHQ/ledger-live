import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import ActionFooter from "../components/ActionFooter";
import NeuronInfoCard from "../components/NeuronInfoCard";
import type { InternetComputerNeuronManageFlowParamList } from "./types";
import Slider from "@react-native-community/slider";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronStakeMaturity
  >
>;

export default function StakeMaturity({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const unit = useAccountUnit(account);
  const { neuronId } = route.params;

  const neurons = mainAccount.neurons?.fullNeurons || [];
  const neuron = useMemo(
    () => neurons.find(n => n.id?.[0]?.id?.toString() === neuronId),
    [neurons, neuronId],
  );

  const maturity = useMemo(
    () => new BigNumber(neuron?.maturity_e8s_equivalent?.toString() || "0"),
    [neuron],
  );

  const [percentage, setPercentage] = useState(100);

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          type: "stake_maturity",
          neuronId,
          percentageToStake: "100",
        }),
      };
    },
  );

  invariant(transaction, "transaction must be defined");

  const onChangePercentage = useCallback(
    (value: number) => {
      const roundedValue = Math.round(value);
      setPercentage(roundedValue);
      setTransaction(
        bridge.updateTransaction(transaction, {
          percentageToStake: roundedValue.toString(),
        }),
      );
    },
    [bridge, setTransaction, transaction],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      source: route.params.source,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [account.id, navigation, parentAccount?.id, route.params.source, status, transaction]);

  const error = bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);

  const maturityToStake = useMemo(() => {
    return maturity.times(percentage).div(100);
  }, [maturity, percentage]);

  const isDisabled = useMemo(() => {
    if (bridgePending || !!bridgeError || hasErrors) return true;
    if (percentage <= 0) return true;
    return false;
  }, [bridgePending, bridgeError, hasErrors, percentage]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="StakeMaturity"
        flow="manage"
        action="stake_maturity"
        currency="internet_computer"
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.action.stakeMaturity.title" />
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.action.stakeMaturity.description" />
          </Text>
        </View>

        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text variant="body" fontWeight="semiBold">
              <Trans i18nKey="icp.neuronManage.stakeMaturity.percentageLabel" />
            </Text>
            <Text variant="h4" fontWeight="semiBold" color="primary.c80">
              {percentage}%
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={percentage}
            onValueChange={onChangePercentage}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text variant="small" color="neutral.c70">
              0%
            </Text>
            <Text variant="small" color="neutral.c70">
              100%
            </Text>
          </View>
        </View>

        <NeuronInfoCard
          neuronId={neuronId}
          unit={unit}
          additionalInfo={[
            {
              labelKey: "icp.neuronManage.stakeMaturity.availableMaturity",
              value: formatCurrencyUnit(unit, maturity, { showCode: true }),
            },
            {
              labelKey: "icp.neuronManage.stakeMaturity.amountToStake",
              value: formatCurrencyUnit(unit, maturityToStake, { showCode: true }),
            },
          ]}
        />
      </View>

      <ActionFooter
        error={error}
        warning={warning}
        onContinue={onContinue}
        isDisabled={isDisabled}
        isPending={bridgePending}
        testID="icp-neuron-stake-maturity-continue"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
