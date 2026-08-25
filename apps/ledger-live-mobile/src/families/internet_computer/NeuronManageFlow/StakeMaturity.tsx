import { BaseInput, Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { TrackScreen } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { toBigNumber } from "../amounts";
import ActionFooter from "../components/ActionFooter";
import { useNeuronAction } from "./useNeuronAction";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronStakeMaturity
>;

const MAX_PERCENTAGE = 100n;

// Guarded rather than a bare BigInt(): a value not written by this screen's own onChange would throw
// inside the conversion while the preview renders.
const enteredPercentage = (percentage: string): bigint =>
  /^\d+$/.test(percentage) ? BigInt(percentage) : 0n;

const isInRange = (percentage: string): boolean => {
  const entered = enteredPercentage(percentage);
  return entered >= 1n && entered <= MAX_PERCENTAGE;
};

/** Stakes a share of the neuron's liquid maturity back into it. The canister takes a percentage. */
export default function StakeMaturity({ navigation, route }: Props) {
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

  // Held locally so the field does not wait on a bridge round-trip; see SetDissolveDelay for why a
  // transaction-backed value loses keystrokes typed faster than the status refresh.
  const [percentage, setPercentage] = useState(() => transaction?.percentageToStake ?? "");

  const onChange = useCallback(
    (next: string) => {
      const digits = next.replace(/\D/g, "");
      // Clamped like the dissolve delay entry: unclamped, "999" previews an amount to stake ten
      // times the maturity the neuron actually has.
      const entered = digits ? BigInt(digits) : 0n;
      const clamped = entered > MAX_PERCENTAGE ? MAX_PERCENTAGE : entered;
      const nextPercentage = digits ? String(clamped) : "";
      setPercentage(nextPercentage);
      updateTransaction(tx => ({ ...tx, percentageToStake: nextPercentage }));
    },
    [updateTransaction],
  );

  if (!neuron) return null;

  const selected = (neuron.maturityE8sEquivalent * enteredPercentage(percentage)) / MAX_PERCENTAGE;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="StakeMaturity"
        flow="stake"
        action="stake_maturity"
      />
      <KeyboardView style={{ flex: 1 }}>
        <Flex flex={1} p={6} style={{ gap: 16 }}>
          <Text variant="body" color="neutral.c70">
            {t("internetComputer.manageNeuronFlow.stakeMaturity.description")}
          </Text>
          <Flex style={{ gap: 8 }}>
            <Text variant="small" fontWeight="semiBold" color="neutral.c70">
              {t("internetComputer.manageNeuronFlow.stakeMaturity.percentage")}
            </Text>
            <BaseInput
              value={percentage}
              onChange={onChange}
              keyboardType="number-pad"
              placeholder="100"
              testID="icp-stake-maturity-input"
            />
          </Flex>
          <Flex flexDirection="row" alignItems="center" style={{ gap: 6 }}>
            <Text variant="small" color="neutral.c70">
              {t("internetComputer.manageNeuronFlow.stakeMaturity.selected")}
            </Text>
            <Text variant="small" color="neutral.c100">
              <CurrencyUnitValue
                disableRounding
                showCode
                unit={unit}
                value={toBigNumber(selected)}
              />
            </Text>
          </Flex>
        </Flex>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={continueToDevice}
        // Gated on the range, not on mere presence: the canister rejects 0 too, and sending the
        // user to their device for a value already known to be invalid is the worse failure.
        canContinue={isInRange(percentage)}
      />
    </SafeAreaView>
  );
}
