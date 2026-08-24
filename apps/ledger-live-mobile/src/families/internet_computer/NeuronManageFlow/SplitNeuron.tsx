import { ICP_FEES } from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  maxAllowedSplitAmount,
  minAllowedSplitAmount,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import { Flex, Text } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import React, { useCallback } from "react";
import { TrackScreen } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import AmountInput from "~/screens/SendFunds/AmountInput";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { toBigNumber } from "../amounts";
import ActionFooter from "../components/ActionFooter";
import { useNeuronAction } from "./useNeuronAction";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronSplit
>;

/**
 * Splits part of the neuron's stake into a new neuron. The parent is debited the full amount and the
 * child receives it minus the fee, so both bounds are shown: the fee raises the floor only.
 */
export default function SplitNeuron({ navigation, route }: Props) {
  const { t } = useTranslation();
  const {
    account,
    neuron,
    transaction,
    updateTransaction,
    status,
    bridgePending,
    continueToDevice,
  } = useNeuronAction(navigation, route);
  const unit = useAccountUnit(account);

  const onChange = useCallback(
    (amount: BigNumber) => updateTransaction(tx => ({ ...tx, amount })),
    [updateTransaction],
  );

  if (!neuron) return null;

  const min = minAllowedSplitAmount(BigInt(ICP_FEES));
  const max = maxAllowedSplitAmount(neuron);
  const amount = transaction?.amount ?? new BigNumber(0);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="SplitNeuron"
        flow="stake"
        action="split_neuron"
      />
      <KeyboardView style={{ flex: 1 }}>
        <Flex flex={1} p={6} style={{ gap: 16 }}>
          <Text variant="body" color="neutral.c70">
            {t("internetComputer.manageNeuronFlow.splitNeuron.description")}
          </Text>
          <AmountInput
            account={account}
            onChange={onChange}
            value={amount}
            error={amount.gt(0) ? status.errors.amount : null}
            warning={status.warnings.amount}
            testID="icp-split-amount-input"
          />
          <Flex flexDirection="row" alignItems="center" justifyContent="center" style={{ gap: 6 }}>
            <Text variant="small" color="neutral.c70">
              {t("internetComputer.manageNeuronFlow.splitNeuron.range")}
            </Text>
            <Text variant="small" color="neutral.c100">
              <CurrencyUnitValue disableRounding unit={unit} value={toBigNumber(min)} />
              {" – "}
              <CurrencyUnitValue disableRounding showCode unit={unit} value={toBigNumber(max)} />
            </Text>
          </Flex>
        </Flex>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={continueToDevice}
        canContinue={amount.gt(0)}
        showAmountError={amount.gt(0)}
      />
    </SafeAreaView>
  );
}
