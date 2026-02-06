import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { ICP_FEES } from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { maxAllowedSplitAmount } from "@ledgerhq/live-common/families/internet_computer/utils";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import CurrencyInput from "~/components/CurrencyInput";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import ActionFooter from "../components/ActionFooter";
import NeuronInfoCard from "../components/NeuronInfoCard";
import type { InternetComputerNeuronManageFlowParamList, NeuronActionType } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronAction
  >
>;

const ACTION_TITLES: Record<NeuronActionType, string> = {
  increase_stake: "icp.neuronManage.action.increaseStake.title",
  start_dissolving: "icp.neuronManage.action.startDissolving.title",
  stop_dissolving: "icp.neuronManage.action.stopDissolving.title",
  disburse: "icp.neuronManage.action.disburse.title",
  spawn_neuron: "icp.neuronManage.action.spawnNeuron.title",
  split_neuron: "icp.neuronManage.action.splitNeuron.title",
  stake_maturity: "icp.neuronManage.action.stakeMaturity.title",
  set_dissolve_delay: "icp.neuronManage.action.setDissolveDelay.title",
  add_hot_key: "icp.neuronManage.action.addHotKey.title",
  remove_hot_key: "icp.neuronManage.action.removeHotKey.title",
  auto_stake_maturity: "icp.neuronManage.action.autoStakeMaturity.title",
  refresh_voting_power: "icp.neuronManage.action.refreshVotingPower.title",
  follow: "icp.neuronManage.action.follow.title",
};

const ACTION_DESCRIPTIONS: Record<NeuronActionType, string> = {
  increase_stake: "icp.neuronManage.action.increaseStake.description",
  start_dissolving: "icp.neuronManage.action.startDissolving.description",
  stop_dissolving: "icp.neuronManage.action.stopDissolving.description",
  disburse: "icp.neuronManage.action.disburse.description",
  spawn_neuron: "icp.neuronManage.action.spawnNeuron.description",
  split_neuron: "icp.neuronManage.action.splitNeuron.description",
  stake_maturity: "icp.neuronManage.action.stakeMaturity.description",
  set_dissolve_delay: "icp.neuronManage.action.setDissolveDelay.description",
  add_hot_key: "icp.neuronManage.action.addHotKey.description",
  remove_hot_key: "icp.neuronManage.action.removeHotKey.description",
  auto_stake_maturity: "icp.neuronManage.action.autoStakeMaturity.description",
  refresh_voting_power: "icp.neuronManage.action.refreshVotingPower.description",
  follow: "icp.neuronManage.action.follow.description",
};

export default function NeuronAction({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const unit = useAccountUnit(account);
  const { neuronId, actionType, autoStakeMaturity } = route.params;

  const neurons = mainAccount.neurons?.fullNeurons || [];
  const neuron = useMemo(
    () => neurons.find(n => n.id?.[0]?.id?.toString() === neuronId),
    [neurons, neuronId],
  );

  // For increase_stake we need the neuron's account identifier
  // This is available directly on the neuron object (same as desktop)
  const neuronAccountIdentifier = neuron?.accountIdentifier;

  const needsAmount =
    actionType === "increase_stake" ||
    actionType === "disburse" ||
    actionType === "split_neuron" ||
    actionType === "stake_maturity";

  // Get neuron stake for split_neuron
  const neuronStake = useMemo(
    () => new BigNumber(neuron?.cached_neuron_stake_e8s?.toString() || "0"),
    [neuron],
  );

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);

      const txUpdate: Record<string, unknown> = {
        type: actionType,
        neuronId,
      };

      if (actionType === "increase_stake" && neuronAccountIdentifier) {
        txUpdate.neuronAccountIdentifier = neuronAccountIdentifier;
      }

      // For auto_stake_maturity, use the value passed from the drawer
      if (actionType === "auto_stake_maturity" && autoStakeMaturity !== undefined) {
        txUpdate.autoStakeMaturity = autoStakeMaturity;
      }

      return {
        account,
        transaction: bridge.updateTransaction(t, txUpdate),
      };
    },
  );

  invariant(transaction, "transaction must be defined");

  const onChangeAmount = useCallback(
    (amount: BigNumber) => {
      setTransaction(
        bridge.updateTransaction(transaction, {
          amount,
        }),
      );
    },
    [bridge, setTransaction, transaction],
  );

  const onUseMax = useCallback(() => {
    if (actionType === "disburse" && neuron) {
      const stake = new BigNumber(neuron.cached_neuron_stake_e8s?.toString() || "0");
      onChangeAmount(stake);
    } else if (actionType === "split_neuron" && neuron) {
      // Use maxAllowedSplitAmount from ledger-live-icp for proper calculation
      const maxAmount = maxAllowedSplitAmount(neuron);
      if (maxAmount.gt(0)) {
        onChangeAmount(maxAmount);
      }
    } else {
      const maxAmount = mainAccount.spendableBalance.minus(BigNumber(ICP_FEES));
      if (maxAmount.gt(0)) {
        onChangeAmount(maxAmount);
      }
    }
  }, [actionType, mainAccount.spendableBalance, neuron, onChangeAmount]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      source: route.params.source,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [account.id, navigation, parentAccount?.id, route.params.source, status, transaction]);

  const error = getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");

  const isDisabled = useMemo(() => {
    if (bridgePending || !!bridgeError || hasStatusError(status)) return true;
    if (needsAmount && transaction.amount.eq(0)) return true;
    return false;
  }, [bridgePending, bridgeError, hasStatusError, needsAmount, transaction.amount]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="NeuronAction"
        flow="manage"
        action={actionType}
        currency="internet_computer"
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            <Trans i18nKey={ACTION_TITLES[actionType]} />
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey={ACTION_DESCRIPTIONS[actionType]} />
          </Text>
        </View>

        {needsAmount && (
          <View style={styles.amountSection}>
            <Text variant="body" fontWeight="semiBold" mb={2}>
              <Trans i18nKey="icp.neuronManage.action.amount" />
            </Text>
            <CurrencyInput
              unit={unit}
              value={transaction.amount}
              onChange={onChangeAmount}
              inputStyle={styles.inputStyle}
              hasError={!!error}
            />
            <TouchableOpacity onPress={onUseMax} style={styles.maxButton}>
              <Text color={colors.primary} fontWeight="semiBold">
                <Trans i18nKey="icp.neuronManage.action.useMax" />
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <NeuronInfoCard
          neuronId={neuronId}
          unit={unit}
          additionalInfo={
            actionType === "split_neuron"
              ? [
                  {
                    labelKey: "icp.neuronManage.action.currentBalance",
                    value: formatCurrencyUnit(unit, neuronStake, { showCode: true }),
                  },
                ]
              : undefined
          }
        />
      </View>

      <ActionFooter
        error={error}
        warning={warning}
        onContinue={onContinue}
        isDisabled={isDisabled}
        isPending={bridgePending}
        testID="icp-neuron-action-continue"
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
  amountSection: {
    marginBottom: 24,
  },
  inputStyle: {
    fontSize: 32,
    fontWeight: "600",
  },
  maxButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
  },
});
