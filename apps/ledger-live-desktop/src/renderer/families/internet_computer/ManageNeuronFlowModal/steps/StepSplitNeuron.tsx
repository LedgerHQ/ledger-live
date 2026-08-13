import { ICP_FEES } from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  maxAllowedSplitAmount,
  minAllowedSplitAmount,
} from "@ledgerhq/live-common/families/internet_computer/neuron";
import BigNumber from "bignumber.js";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import { toBigNumber } from "../../amounts";
import SubmitFooter from "./SubmitFooter";
import type { StepProps } from "../../neuronFlow/types";

/**
 * Splits part of the neuron's stake into a new neuron. The parent is debited the full amount and the
 * child receives it minus the fee, so both bounds are shown: the fee raises the floor only.
 */
const StepSplitNeuron = ({
  account,
  neurons,
  selectedNeuronId,
  transaction,
  status,
  onUpdateTransaction,
}: StepProps) => {
  const { t } = useTranslation();
  const unit = account.currency.units[0];
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);

  const onChange = useCallback(
    (amount: BigNumber) => onUpdateTransaction(tx => ({ ...tx, amount })),
    [onUpdateTransaction],
  );

  if (!neuron) return null;

  const min = minAllowedSplitAmount(BigInt(ICP_FEES));
  const max = maxAllowedSplitAmount(neuron);
  const amount = transaction?.amount ?? new BigNumber(0);

  return (
    <Box flow={3} px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.description" />
      </Text>
      <Box flow={1}>
        <Label>
          <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.amount" />
        </Label>
        <InputCurrency
          autoFocus
          error={amount.gt(0) ? status.errors.amount : null}
          defaultUnit={unit}
          value={amount}
          onChange={onChange}
          renderLeft={false}
          containerProps={{ grow: true }}
          data-testid="icp-split-amount-input"
        />
      </Box>
      <Box horizontal alignItems="center" style={{ gap: 6 }}>
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
          {t("internetComputer.manageNeuronFlow.splitNeuron.range")}
        </Text>
        <FormattedVal val={toBigNumber(min)} unit={unit} disableRounding fontSize={3} />
        <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
          {"–"}
        </Text>
        <FormattedVal val={toBigNumber(max)} unit={unit} showCode disableRounding fontSize={3} />
      </Box>
    </Box>
  );
};

export const StepSplitNeuronFooter = (props: StepProps) => (
  <SubmitFooter {...props} canContinue={!!props.transaction?.amount.gt(0)} />
);

export default StepSplitNeuron;
