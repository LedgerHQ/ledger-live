import {
  NNS_MAXIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import { getNeuronDissolveDurationSeconds } from "@ledgerhq/live-common/families/internet_computer/neuron";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import { useFormatDuration } from "../../useFormatDuration";
import SubmitFooter from "./SubmitFooter";
import type { StepProps } from "../../neuronFlow/types";

const MAX_DAYS = Math.floor(NNS_MAXIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY);

const isPositive = (seconds: string): boolean => /^\d+$/.test(seconds) && BigInt(seconds) > 0n;

/**
 * Dissolve delay is entered in days, the unit the NNS bounds are quoted in. A dissolved neuron sets
 * its delay outright; a locked one may only add to it, so the same screen drives two transaction
 * types and the current delay is the floor for one and zero for the other.
 */
const StepSetDissolveDelay = ({
  neurons,
  selectedNeuronId,
  transaction,
  onUpdateTransaction,
}: StepProps) => {
  const { t } = useTranslation();
  const formatDuration = useFormatDuration();
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);
  const isIncrease = transaction?.type === "increase_dissolve_delay";
  const currentSeconds = neuron ? getNeuronDissolveDurationSeconds(neuron) : 0n;

  const value = isIncrease
    ? (transaction?.additionalDissolveDelay ?? "")
    : (transaction?.dissolveDelay ?? "");
  const enteredSeconds = value ? BigInt(value) : 0n;
  const days = value ? String(enteredSeconds / BigInt(SECONDS_IN_DAY)) : "";

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
      const seconds = digits ? String(clamped * BigInt(SECONDS_IN_DAY)) : "";
      onUpdateTransaction(tx => ({
        ...tx,
        ...(isIncrease ? { additionalDissolveDelay: seconds } : { dissolveDelay: seconds }),
      }));
    },
    [allowedDays, isIncrease, onUpdateTransaction],
  );

  if (!neuron) return null;

  const resultingSeconds = isIncrease ? currentSeconds + enteredSeconds : enteredSeconds;

  return (
    <Box flow={3} px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans
          i18nKey={
            isIncrease
              ? "internetComputer.manageNeuronFlow.setDissolveDelay.increaseDescription"
              : "internetComputer.manageNeuronFlow.setDissolveDelay.setDescription"
          }
          values={{
            min: Math.ceil(NNS_MINIMUM_DISSOLVE_DELAY / SECONDS_IN_DAY),
            max: MAX_DAYS,
            remaining: String(allowedDays),
          }}
        />
      </Text>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70" mb={1}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.days" />
        </Text>
        <Input
          value={days}
          onChange={onChange}
          placeholder={String(allowedDays)}
          data-testid="icp-dissolve-delay-input"
        />
      </Box>
      <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
        {t("internetComputer.manageNeuronFlow.setDissolveDelay.resulting", {
          duration: formatDuration(resultingSeconds),
        })}
      </Text>
      {resultingSeconds > 0n && resultingSeconds < BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE) ? (
        <Text ff="Inter|Regular" fontSize={3} color="warning.c70">
          <Trans
            i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.belowVotingThreshold"
            values={{ days: Math.ceil(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE / SECONDS_IN_DAY) }}
          />
        </Text>
      ) : null}
    </Box>
  );
};

// Gated on a positive delay rather than on presence: "0" is a non-empty string, so a zero-day entry
// used to reach the bridge and come back as a range error nobody can read.
export const StepSetDissolveDelayFooter = (props: StepProps) => {
  const { transaction } = props;
  const entered =
    transaction?.type === "increase_dissolve_delay"
      ? transaction.additionalDissolveDelay
      : transaction?.dissolveDelay;

  return <SubmitFooter {...props} canContinue={isPositive(entered ?? "")} hasInput={!!entered} />;
};

export default StepSetDissolveDelay;
