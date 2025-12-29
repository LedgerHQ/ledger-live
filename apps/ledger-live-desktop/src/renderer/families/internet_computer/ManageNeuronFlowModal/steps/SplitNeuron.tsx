import React, { useState } from "react";
import { BigNumber } from "bignumber.js";
import { Trans, useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { ICP_FEES } from "@ledgerhq/live-common/families/internet_computer/consts";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import TrackPage from "~/renderer/analytics/TrackPage";
import { StepProps } from "../types";
import { useSplitNeuron } from "./hooks/useSplitNeuron";

export function SplitNeuron({
  manageNeuronIndex,
  neurons,
  account,
  status,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: StepProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");

  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const { errors } = status;
  const unit = account.currency.units[0];
  const currencyId = account.currency.id;
  const neuronBalance = BigNumber(neuron.cached_neuron_stake_e8s.toString());

  const { neuronId, maxAmount, onAmountChange, onConfirmSplit, onCancel } = useSplitNeuron({
    account,
    neuron,
    unit,
    onChangeTransaction,
    setLastManageAction,
    transitionTo,
  });

  const handleAmountChange = (value: string) => {
    setAmount(value);
    onAmountChange(value);
  };

  const handleMax = () => {
    setAmount(maxAmount);
    onAmountChange(maxAmount);
  };

  const handleConfirm = () => {
    onConfirmSplit(amount);
  };

  const formattedBalance = formatCurrencyUnit(unit, neuronBalance, {
    showCode: true,
    disableRounding: true,
  });

  const formattedFee = formatCurrencyUnit(unit, BigNumber(ICP_FEES), {
    showCode: true,
    disableRounding: true,
  });

  return (
    <Box>
      <TrackPage
        category="Split Neuron ICP Flow"
        name="Step Split"
        flow="split"
        action="splitNeuron"
        currency={currencyId}
      />

      <Text ff="Inter|SemiBold" fontSize={22} mb={12}>
        <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.title" />
      </Text>

      <Box mb={12}>
        <Box horizontal alignItems="center">
          <Text ff="Inter|Regular" fontSize={14}>
            <Trans i18nKey="internetComputer.common.neuronId" />
          </Text>
          <Text ml={1} ff="Inter|SemiBold" fontSize={16}>
            {neuronId}
          </Text>
        </Box>
        <Box horizontal alignItems="center" mb={12}>
          <Text ff="Inter|Regular" fontSize={14}>
            <Trans i18nKey="internetComputer.common.currentBalance" />
          </Text>
          <Text ml={1} ff="Inter|SemiBold" fontSize={16}>
            {formattedBalance}
          </Text>
        </Box>

        <Box horizontal justifyContent="space-between" alignItems="center">
          <Text ff="Inter|Medium" fontSize={14}>
            <Trans i18nKey="internetComputer.common.amount" />
          </Text>
          <Button onClick={handleMax} small>
            <Trans i18nKey="common.max" />
          </Button>
        </Box>

        <Input
          value={amount}
          onChange={handleAmountChange}
          error={!!amount && errors.splitNeuron}
          placeholder="0"
          type="number"
        />
      </Box>

      <Box mb={24}>
        <Box>
          <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade80">
            <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.transactionFee" />:{" "}
            <Text ff="Inter|Bold" fontSize={12} color="palette.text.shade80">
              {formattedFee}
            </Text>
          </Text>
        </Box>
      </Box>

      <Box horizontal justifyContent="flex-end">
        <Button mr={2} onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button primary onClick={handleConfirm} disabled={!!errors.splitNeuron}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.confirmSplit" />
        </Button>
      </Box>
    </Box>
  );
}
