import React, { useCallback, useState } from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import { StepProps } from "../types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import { maxAllowedSplitAmount } from "@ledgerhq/live-common/families/internet_computer/utils";
import { Trans, useTranslation } from "react-i18next";

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

  const onChangeAmount = useCallback(
    (value: string) => {
      setAmount(value);
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "split_neuron",
          amount: BigNumber(value || "0").multipliedBy(10 ** unit.magnitude),
        }),
      );
    },
    [account, neuron.id, onChangeTransaction, unit.magnitude],
  );

  const handleMax = useCallback(() => {
    onChangeAmount(
      maxAllowedSplitAmount(neuron)
        .div(10 ** unit.magnitude)
        .toString(),
    );
  }, [neuron, onChangeAmount, unit.magnitude]);

  const onClickConfirmSplit = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = "split_neuron";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
        amount: BigNumber(amount).multipliedBy(10 ** unit.magnitude),
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [
    account,
    onChangeTransaction,
    transitionTo,
    neuron,
    setLastManageAction,
    amount,
    unit.magnitude,
  ]);

  const formattedBalance = formatCurrencyUnit(unit, neuronBalance, {
    showCode: true,
    disableRounding: true,
  });

  const txFee = BigNumber(0.0001);
  const formattedFee = formatCurrencyUnit(unit, txFee.multipliedBy(10 ** unit.magnitude), {
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
            {neuron.id[0]?.id.toString()}
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
          onChange={onChangeAmount}
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
        <Button mr={2} onClick={() => transitionTo("manage")}>
          {t("common.cancel")}
        </Button>
        <Button primary onClick={onClickConfirmSplit} disabled={!!errors.splitNeuron}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.splitNeuron.confirmSplit" />
        </Button>
      </Box>
    </Box>
  );
}
