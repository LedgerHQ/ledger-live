import React, { useCallback, useState } from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import { StepProps } from "../types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { Trans, useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  SECONDS_IN_DAY,
  MAX_DISSOLVE_DELAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  getMinDissolveDelay,
  secondsToDurationString,
  neuronPotentialVotingPower,
} from "@ledgerhq/live-common/families/internet_computer/utils";

export function SetDissolveDelay({
  manageNeuronIndex,
  neurons,
  account,
  status,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: StepProps) {
  const { t } = useTranslation();
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const minDissolveDelay = (getMinDissolveDelay(neuron) / SECONDS_IN_DAY).toPrecision(4);
  const maxDissolveDelay = (MAX_DISSOLVE_DELAY / SECONDS_IN_DAY).toPrecision(4);
  const [dissolveDelay, setDissolveDelay] = useState(minDissolveDelay.toString());
  const { errors } = status;

  const onChangeDissolveDelay = useCallback(
    (value: string) => {
      setDissolveDelay(value);
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      const valueInSeconds = BigNumber(value).times(SECONDS_IN_DAY).toString();
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "set_dissolve_delay",
          dissolveDelay: valueInSeconds,
        }),
      );
    },
    [account, neuron.id, onChangeTransaction],
  );

  const onClickIncreaseDissolveDelay = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = "set_dissolve_delay";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
        dissolveDelay: BigNumber(dissolveDelay).times(SECONDS_IN_DAY).toString(),
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction, dissolveDelay]);

  return (
    <Box p={20}>
      <Text ff="Inter|SemiBold" fontSize={22} mb={10}>
        <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.title" />
      </Text>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          <Trans i18nKey="internetComputer.common.neuronId" />
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
          {neuron.id[0]?.id.toString()}
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          <Trans i18nKey="internetComputer.common.balance" />
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
          {formatCurrencyUnit(
            account.currency.units[0],
            BigNumber(neuron.cached_neuron_stake_e8s.toString()),
            {
              showCode: false,
              disableRounding: true,
            },
          )}
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.dissolveDelay" />
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade60" mb={2}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.dissolveDelayTooltip" />
        </Text>

        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade60">
          <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.votingPowerDescription" />
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14} mb={2}>
          <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.dissolveDelayInput" />
        </Text>

        <Box horizontal justifyContent="space-between">
          <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade80">
            Min: {minDissolveDelay}
          </Text>
          <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade80">
            Max: {maxDissolveDelay}
          </Text>
        </Box>
        <Input
          value={dissolveDelay}
          onChange={onChangeDissolveDelay}
          error={errors.dissolveDelay}
          placeholder={t("internetComputer.manageNeuronFlow.setDissolveDelay.inputPlaceholder")}
          type="number"
          min="0"
        />

        <Box horizontal justifyContent="space-between" alignItems="center" padding={20}>
          <Box alignItems="center">
            <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade60">
              {dissolveDelay
                ? secondsToDurationString(BigNumber(dissolveDelay).times(SECONDS_IN_DAY).toString())
                : "0"}
            </Text>
            <Text ff="Inter|SemiBold" fontSize={12} color="palette.text.shade60">
              <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.dissolveDelay" />
            </Text>
          </Box>
          <Box alignItems="center">
            <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade60">
              {dissolveDelay
                ? neuronPotentialVotingPower({
                    neuron,
                    newDissolveDelayInSeconds: BigNumber(dissolveDelay)
                      .times(SECONDS_IN_DAY)
                      .integerValue()
                      .toNumber(),
                  }).toString()
                : "0"}
            </Text>
            <Text ff="Inter|SemiBold" fontSize={12} color="palette.text.shade60">
              <Trans i18nKey="internetComputer.common.votingPower" />
            </Text>
          </Box>
        </Box>
      </Box>

      <Box horizontal justifyContent="flex-end">
        <Button mr={2} onClick={() => transitionTo("manage")}>
          {t("common.cancel")}
        </Button>
        <Button
          primary
          onClick={onClickIncreaseDissolveDelay}
          disabled={!dissolveDelay || isNaN(parseFloat(dissolveDelay)) || errors.dissolveDelay}
        >
          <Trans i18nKey="internetComputer.manageNeuronFlow.setDissolveDelay.updateDelay" />
        </Button>
      </Box>
    </Box>
  );
}
