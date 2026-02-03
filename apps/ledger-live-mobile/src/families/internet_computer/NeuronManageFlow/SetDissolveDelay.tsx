import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  MAX_DISSOLVE_DELAY,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  getMinDissolveDelay,
  secondsToDurationString,
  neuronPotentialVotingPower,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, TextInput } from "react-native";
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

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronSetDissolveDelay
  >
>;

export default function SetDissolveDelay({ navigation, route }: Props) {
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

  const minDissolveDelayDays = useMemo(() => {
    if (!neuron) return 183;
    return Math.ceil(getMinDissolveDelay(neuron) / SECONDS_IN_DAY);
  }, [neuron]);

  const maxDissolveDelayDays = Math.floor(MAX_DISSOLVE_DELAY / SECONDS_IN_DAY);

  const [dissolveDelayDays, setDissolveDelayDays] = useState(minDissolveDelayDays.toString());

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);
      const dissolveDelaySeconds = BigNumber(minDissolveDelayDays).times(SECONDS_IN_DAY).toString();
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          type: "set_dissolve_delay",
          neuronId,
          dissolveDelay: dissolveDelaySeconds,
        }),
      };
    },
  );

  invariant(transaction, "transaction must be defined");

  const onChangeDissolveDelay = useCallback(
    (value: string) => {
      setDissolveDelayDays(value);
      const numValue = parseFloat(value) || 0;
      const dissolveDelaySeconds = BigNumber(numValue).times(SECONDS_IN_DAY).toString();
      setTransaction(
        bridge.updateTransaction(transaction, {
          dissolveDelay: dissolveDelaySeconds,
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

  const dissolveDelaySeconds = useMemo(() => {
    const days = parseFloat(dissolveDelayDays) || 0;
    return BigNumber(days).times(SECONDS_IN_DAY).toNumber();
  }, [dissolveDelayDays]);

  const stake = useMemo(
    () => new BigNumber(neuron?.cached_neuron_stake_e8s?.toString() || "0"),
    [neuron],
  );

  const potentialVotingPower = useMemo(() => {
    if (!neuron || dissolveDelaySeconds <= 0) return "0";
    return neuronPotentialVotingPower({
      neuron,
      newDissolveDelayInSeconds: dissolveDelaySeconds,
    }).toString();
  }, [neuron, dissolveDelaySeconds]);

  const isDisabled = useMemo(() => {
    if (bridgePending || !!bridgeError || hasErrors) return true;
    const days = parseFloat(dissolveDelayDays) || 0;
    if (days < minDissolveDelayDays || days > maxDissolveDelayDays) return true;
    return false;
  }, [
    bridgePending,
    bridgeError,
    hasErrors,
    dissolveDelayDays,
    minDissolveDelayDays,
    maxDissolveDelayDays,
  ]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="SetDissolveDelay"
        flow="manage"
        action="set_dissolve_delay"
        currency="internet_computer"
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.action.setDissolveDelay.title" />
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.action.setDissolveDelay.description" />
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.setDissolveDelay.inputLabel" />
          </Text>
          <View style={styles.rangeInfo}>
            <Text variant="small" color="neutral.c70">
              Min: {minDissolveDelayDays} days
            </Text>
            <Text variant="small" color="neutral.c70">
              Max: {maxDissolveDelayDays} days
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: error ? colors.alert : colors.border },
            ]}
            value={dissolveDelayDays}
            onChangeText={onChangeDissolveDelay}
            keyboardType="numeric"
            placeholder="Enter days"
            placeholderTextColor={colors.border}
          />
        </View>

        <NeuronInfoCard
          neuronId={neuronId}
          unit={unit}
          additionalInfo={[
            {
              labelKey: "icp.neuronManage.setDissolveDelay.balance",
              value: formatCurrencyUnit(unit, stake, { showCode: true }),
            },
            {
              labelKey: "icp.neuronManage.setDissolveDelay.duration",
              value:
                dissolveDelaySeconds > 0
                  ? secondsToDurationString(dissolveDelaySeconds.toString())
                  : "-",
            },
            {
              labelKey: "icp.neuronManage.setDissolveDelay.votingPower",
              value: potentialVotingPower,
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
        testID="icp-neuron-set-dissolve-delay-continue"
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
  inputSection: {
    marginBottom: 24,
  },
  rangeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
  },
});
