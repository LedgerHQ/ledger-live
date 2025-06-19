import React, { useCallback, useState } from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Slider from "~/renderer/components/Slider";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Trans } from "react-i18next";

export function StakeMaturity({
  manageNeuronIndex,
  neurons,
  account,
  status,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: StepProps) {
  const [maturityPercentageToStake, setMaturityPercentageToStake] = useState(0);
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const { errors } = status;

  const onClickStakeMaturity = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = "stake_maturity";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
        percentageToStake: maturityPercentageToStake.toString(),
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
    maturityPercentageToStake,
  ]);

  const availableMaturity =
    Number(neuron.maturity_e8s_equivalent) / 10 ** account.currency.units[0].magnitude;

  return (
    <Box p={20}>
      <Text ff="Inter|SemiBold" fontSize={22} mb={10}>
        <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.title" />
      </Text>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.maturityAvailable" />
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
          {availableMaturity}
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade60" mb={2}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.description" />
        </Text>
      </Box>

      <Box mb={10}>
        <Slider
          value={maturityPercentageToStake}
          onChange={setMaturityPercentageToStake}
          steps={101}
          error={errors.stakeMaturity}
        />
        <Box horizontal justifyContent="space-between">
          <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade60">
            {(availableMaturity * maturityPercentageToStake) / 100}
          </Text>
          <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade60">
            {maturityPercentageToStake}%
          </Text>
        </Box>
      </Box>

      <Box horizontal justifyContent="flex-end" mt={4}>
        <Button mr={2} onClick={() => transitionTo("manage")}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          primary
          onClick={onClickStakeMaturity}
          disabled={maturityPercentageToStake === 0 || errors.stakeMaturity}
        >
          <Trans i18nKey="internetComputer.manageNeuronFlow.stakeMaturity.confirmStake" />
        </Button>
      </Box>
    </Box>
  );
}
