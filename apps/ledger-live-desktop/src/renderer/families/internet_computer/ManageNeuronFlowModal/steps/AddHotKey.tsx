import React, { useCallback, useState } from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Trans } from "react-i18next";

export function AddHotKey({
  manageNeuronIndex,
  neurons,
  account,
  status,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: StepProps) {
  const [hotKey, setHotKey] = useState("");
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const { errors } = status;
  const currencyId = account.currency.id;

  const onChangeHotKey = useCallback(
    (value: string) => {
      setHotKey(value);
      const bridge = getAccountBridge(account);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "add_hot_key",
          hotKeyToAdd: value,
        }),
      );
    },
    [account, neuron.id, onChangeTransaction],
  );

  const onClickConfirmAddHotKey = useCallback(() => {
    const bridge = getAccountBridge(account);
    const initTx = bridge.createTransaction(account);
    const action = "add_hot_key";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
        hotKeyToAdd: hotKey,
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [account, neuron, hotKey, onChangeTransaction, transitionTo, setLastManageAction]);

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
        <Trans i18nKey="internetComputer.manageNeuronFlow.addHotKey.title" />
      </Text>

      <Box mb={12}>
        <Input
          value={hotKey}
          onChange={onChangeHotKey}
          error={!!hotKey && errors.addHotKey}
          placeholder="Principal ID"
          type="text"
        />
      </Box>

      <Box horizontal justifyContent="flex-end">
        <Button mr={2} onClick={() => transitionTo("manage")}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button primary onClick={onClickConfirmAddHotKey} disabled={!hotKey || !!errors.addHotKey}>
          <Trans i18nKey="common.confirm" />
        </Button>
      </Box>
    </Box>
  );
}
