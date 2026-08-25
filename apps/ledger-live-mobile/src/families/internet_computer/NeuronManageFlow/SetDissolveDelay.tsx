import {
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import { getNeuronDissolveDurationSeconds } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { BaseInput, Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { TrackScreen } from "~/analytics";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import ActionFooter from "../components/ActionFooter";
import { useFormatDuration } from "../useFormatDuration";
import { useNeuronAction } from "./useNeuronAction";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronSetDissolveDelay
>;

export const MAX_DAYS = Math.floor(NNS_MAXIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY);

/**
 * Dissolve delay is entered in days, the unit the NNS bounds are quoted in. A dissolved neuron sets
 * its delay outright; a locked one may only add to it, so the same screen drives two transaction
 * types and the current delay is the floor for one and zero for the other.
 */
export default function SetDissolveDelay({ navigation, route }: Props) {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const { neuron, transaction, updateTransaction, status, bridgePending, continueToDevice } =
    useNeuronAction(navigation, route);

  const isIncrease = transaction?.type === "increase_dissolve_delay";

  // Held locally rather than read back out of the transaction. BaseInput is fully controlled, and a
  // transaction round-trip is not one render: updateTransaction schedules prepareTransaction and
  // getTransactionStatus, debounced by 300ms after the first. The handler saw every keystroke, but
  // the field displayed whatever the transaction had last echoed back, so typing "9999" left "9" on
  // screen while the transaction held the clamped value.
  const [days, setDays] = useState(() => {
    const seconds =
      transaction?.type === "increase_dissolve_delay"
        ? transaction.additionalDissolveDelay
        : transaction?.dissolveDelay;
    return seconds ? String(BigInt(seconds) / BigInt(SECONDS_IN_DAY)) : "";
  });
  const enteredSeconds = days ? BigInt(days) * BigInt(SECONDS_IN_DAY) : 0n;

  // Read before the guard below because onChange closes over it: hooks cannot sit behind an early
  // return, so the delay has to be resolvable while the neuron is still optional.
  const currentSeconds = neuron ? getNeuronDissolveDurationSeconds(neuron) : 0n;

  // An increase is bounded by the room left under the maximum, not by the maximum itself: the bridge
  // rejects `current + additional > max`, so clamping to MAX_DAYS would still let the entry overshoot.
  const remainingSeconds = BigInt(NNS_MAXIMUM_DISSOLVE_DELAY) - currentSeconds;
  const remainingDays = remainingSeconds > 0n ? remainingSeconds / BigInt(SECONDS_IN_DAY) : 0n;
  const allowedDays = isIncrease ? remainingDays : BigInt(MAX_DAYS);

  const onChange = useCallback(
    (nextDays: string) => {
      const digits = nextDays.replace(/\D/g, "");
      // Parsed as BigInt, not Number: a pasted 300-digit value overflows to Infinity, which then
      // throws inside BigInt() while the resulting delay renders. Clamping holds the input to the
      // bound the description already advertises, rather than leaving it to submit-time validation.
      const entered = digits ? BigInt(digits) : 0n;
      const clamped = entered > allowedDays ? allowedDays : entered;
      setDays(digits ? String(clamped) : "");
      const seconds = digits ? String(clamped * BigInt(SECONDS_IN_DAY)) : "";
      updateTransaction(tx => ({
        ...tx,
        ...(isIncrease ? { additionalDissolveDelay: seconds } : { dissolveDelay: seconds }),
      }));
    },
    [allowedDays, isIncrease, updateTransaction],
  );

  if (!neuron) return null;

  const resultingSeconds = isIncrease ? currentSeconds + enteredSeconds : enteredSeconds;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="SetDissolveDelay"
        flow="stake"
        action={transaction?.type}
      />
      <KeyboardView style={{ flex: 1 }}>
        <Flex flex={1} p={6} style={{ gap: 16 }}>
          <Text variant="body" color="neutral.c70">
            {t(
              isIncrease
                ? "internetComputer.manageNeuronFlow.setDissolveDelay.increaseDescription"
                : "internetComputer.manageNeuronFlow.setDissolveDelay.setDescription",
              {
                min: Math.ceil(NNS_MINIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY),
                max: MAX_DAYS,
                remaining: String(allowedDays),
              },
            )}
          </Text>
          <Flex style={{ gap: 8 }}>
            <Text variant="small" fontWeight="semiBold" color="neutral.c70">
              {t("internetComputer.manageNeuronFlow.setDissolveDelay.days")}
            </Text>
            <BaseInput
              value={days}
              onChange={onChange}
              keyboardType="number-pad"
              placeholder={String(allowedDays)}
              testID="icp-dissolve-delay-input"
            />
          </Flex>
          <Text variant="small" color="neutral.c70">
            {t("internetComputer.manageNeuronFlow.setDissolveDelay.resulting", {
              duration: formatDuration(resultingSeconds),
            })}
          </Text>
          {resultingSeconds > 0n &&
          resultingSeconds < BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) ? (
            <Text variant="small" color="warning.c70">
              {t("internetComputer.manageNeuronFlow.setDissolveDelay.belowVotingThreshold", {
                days: Math.ceil(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE / SECONDS_IN_DAY),
              })}
            </Text>
          ) : null}
        </Flex>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={continueToDevice}
        // Gated on a positive delay rather than on presence: a zero-day entry stores "0" seconds,
        // which is a non-empty string, so it used to reach the bridge and come back as a range error.
        canContinue={enteredSeconds > 0n}
        pristineField={days ? undefined : "transaction"}
      />
    </SafeAreaView>
  );
}
