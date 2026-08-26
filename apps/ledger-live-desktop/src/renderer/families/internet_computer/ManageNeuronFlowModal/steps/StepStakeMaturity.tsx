import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import { toBigNumber } from "../../amounts";
import SubmitFooter from "./SubmitFooter";
import type { StepProps } from "../../neuronFlow/types";

const MAX_PERCENTAGE = 100n;

// Guarded rather than a bare BigInt(): a value not written by this step's own onChange would throw
// inside the conversion while the preview renders.
const enteredPercentage = (percentage: string): bigint =>
  /^\d+$/.test(percentage) ? BigInt(percentage) : 0n;

const isInRange = (percentage: string): boolean => {
  const entered = enteredPercentage(percentage);
  return entered >= 1n && entered <= MAX_PERCENTAGE;
};

/** Stakes a share of the neuron's liquid maturity back into it. The canister takes a percentage. */
const StepStakeMaturity = ({
  account,
  neurons,
  selectedNeuronId,
  transaction,
  onUpdateTransaction,
}: StepProps) => {
  const { t } = useTranslation();
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);
  const percentage = transaction?.percentageToStake ?? "";

  const onChange = useCallback(
    (next: string) => {
      const digits = next.replace(/\D/g, "");
      // Clamped like the dissolve delay entry: unclamped, "999" previews an amount to stake ten times
      // the maturity the neuron actually has.
      const entered = digits ? BigInt(digits) : 0n;
      const clamped = entered > MAX_PERCENTAGE ? MAX_PERCENTAGE : entered;
      onUpdateTransaction(tx => ({ ...tx, percentageToStake: digits ? String(clamped) : "" }));
    },
    [onUpdateTransaction],
  );

  if (!neuron) return null;

  const selected = (neuron.maturityE8sEquivalent * enteredPercentage(percentage)) / MAX_PERCENTAGE;

  return (
    <Box flow={3} px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.description" />
      </Text>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70" mb={1}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.percentage" />
        </Text>
        <Input
          value={percentage}
          onChange={onChange}
          placeholder="100"
          data-testid="icp-stake-maturity-input"
        />
      </Box>
      <Box horizontal alignItems="center" style={{ gap: 6 }}>
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
          {t("internetComputer.manageNeuronFlow.stakeMaturity.selected")}
        </Text>
        <FormattedVal
          val={toBigNumber(selected)}
          unit={account.currency.units[0]}
          showCode
          disableRounding
          fontSize={3}
          color="neutral.c100"
        />
      </Box>
    </Box>
  );
};

// Gated on the range rather than on mere presence: the bridge rejects 0 too, but its error has no
// translation, so the banner would read "ICPInvalidPercentage".
export const StepStakeMaturityFooter = (props: StepProps) => (
  <SubmitFooter
    {...props}
    canContinue={isInRange(props.transaction?.percentageToStake ?? "")}
    hasInput={!!props.transaction?.percentageToStake}
  />
);

export default StepStakeMaturity;
