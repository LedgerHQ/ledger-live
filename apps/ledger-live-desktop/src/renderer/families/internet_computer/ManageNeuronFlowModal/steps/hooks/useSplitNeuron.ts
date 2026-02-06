import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  ICPAccount,
  ICPNeuron,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { maxAllowedSplitAmount } from "@ledgerhq/live-common/families/internet_computer/utils";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo } from "react";

type UseSplitNeuronParams = {
  account: ICPAccount;
  neuron: ICPNeuron;
  unit: Unit;
  onChangeTransaction: (tx: Transaction) => void;
  setLastManageAction: (action: "split_neuron") => void;
  transitionTo: (step: string) => void;
};

export function useSplitNeuron({
  account,
  neuron,
  unit,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: UseSplitNeuronParams) {
  const neuronId = neuron.id[0]?.id.toString();

  const updateTransaction = useCallback(
    (amount: BigNumber) => {
      const bridge = getAccountBridge(account);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId,
          type: "split_neuron",
          amount,
        }),
      );
    },
    [account, neuronId, onChangeTransaction],
  );

  const amountToE8s = useCallback(
    (value: string) => BigNumber(value || "0").multipliedBy(10 ** unit.magnitude),
    [unit.magnitude],
  );

  const e8sToAmount = useCallback(
    (e8s: BigNumber) => e8s.div(10 ** unit.magnitude).toString(),
    [unit.magnitude],
  );

  const maxAmount = useMemo(
    () => e8sToAmount(maxAllowedSplitAmount(neuron)),
    [neuron, e8sToAmount],
  );

  const onAmountChange = useCallback(
    (value: string) => {
      updateTransaction(amountToE8s(value));
    },
    [updateTransaction, amountToE8s],
  );

  const onConfirmSplit = useCallback(
    (amount: string) => {
      updateTransaction(amountToE8s(amount));
      setLastManageAction("split_neuron");
      transitionTo("manageAction");
    },
    [updateTransaction, amountToE8s, setLastManageAction, transitionTo],
  );

  const onCancel = useCallback(() => {
    transitionTo("manage");
  }, [transitionTo]);

  return {
    neuronId,
    maxAmount,
    onAmountChange,
    onConfirmSplit,
    onCancel,
  };
}
