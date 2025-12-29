import { useCallback } from "react";
import { useDispatch } from "react-redux";
import BigNumber from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { closeModal } from "~/renderer/actions/modals";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import {
  ICPAccount,
  ICPNeuron,
  ICPTransactionType,
  InternetComputerOperation,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { OpenModal } from "~/renderer/actions/modals";

type UseNeuronActionsParams = {
  account: ICPAccount;
  neuron: ICPNeuron;
  manageNeuronIndex: number;
  openModal: OpenModal;
  onChangeTransaction: (tx: Transaction) => void;
  transitionTo: (step: string) => void;
  setLastManageAction: (action: ICPTransactionType) => void;
};

export function useNeuronActions({
  account,
  neuron,
  manageNeuronIndex,
  openModal,
  onChangeTransaction,
  transitionTo,
  setLastManageAction,
}: UseNeuronActionsParams) {
  const dispatch = useDispatch();

  const onClickIncreaseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        onConfirmationHandler: (optimisticOperation: InternetComputerOperation) => {
          dispatch(
            updateAccountWithUpdater(account.id, account => {
              if (optimisticOperation.type !== "NONE") {
                account = addPendingOperation(account, optimisticOperation);
              }
              return account;
            }),
          );
          dispatch(
            openModal("MODAL_ICP_LIST_NEURONS", {
              account,
              lastManageAction: "increase_stake",
              neuronIndex: manageNeuronIndex,
              stepId: "confirmation",
            }),
          );
        },
        account,
        transaction: {
          ...initTx,
          neuronAccountIdentifier: neuron.accountIdentifier,
          neuronId: neuron.id[0]?.id.toString(),
          type: "increase_stake",
        },
      }),
    );
  }, [account, dispatch, openModal, neuron, manageNeuronIndex]);

  const onClickDisburseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        amount: new BigNumber(neuron.cached_neuron_stake_e8s.toString()),
        type: "disburse",
      }),
    );
    setLastManageAction("disburse");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickConfirmFollowing = useCallback(
    (neuronToConfirm: ICPNeuron) => {
      if (account.type !== "Account") return;
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "refresh_voting_power",
          neuronId: neuronToConfirm.id[0]?.id.toString(),
        }),
      );
      setLastManageAction("refresh_voting_power");
      transitionTo("manageAction");
    },
    [account, onChangeTransaction, transitionTo, setLastManageAction],
  );

  const onClickStartStopDissolving = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = neuron.dissolveState === "Dissolving" ? "stop_dissolving" : "start_dissolving";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickAutoStakeMaturity = useCallback(
    (enabled: boolean) => {
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "auto_stake_maturity",
          autoStakeMaturity: enabled,
        }),
      );
      setLastManageAction("auto_stake_maturity");
      transitionTo("manageAction");
    },
    [account, onChangeTransaction, transitionTo, neuron, setLastManageAction],
  );

  const onClickFollow = useCallback(() => {
    transitionTo("followTopic");
  }, [transitionTo]);

  const onClickSplitNeuron = useCallback(() => {
    setLastManageAction("split_neuron");
    transitionTo("splitNeuron");
  }, [transitionTo, setLastManageAction]);

  const onClickAddHotKey = useCallback(() => {
    setLastManageAction("add_hot_key");
    transitionTo("addHotKey");
  }, [transitionTo, setLastManageAction]);

  const onClickRemoveHotKey = useCallback(
    (hotKey: string) => {
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "remove_hot_key",
          neuronId: neuron.id[0]?.id.toString(),
          hotKeyToRemove: hotKey,
        }),
      );
      setLastManageAction("remove_hot_key");
      transitionTo("manageAction");
    },
    [account, onChangeTransaction, transitionTo, neuron, setLastManageAction],
  );

  const onClickSpawnNeuron = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: "spawn_neuron",
      }),
    );
    setLastManageAction("spawn_neuron");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickSetDissolveDelay = useCallback(() => {
    transitionTo("setDissolveDelay");
  }, [transitionTo]);

  const onClickStakeMaturity = useCallback(() => {
    transitionTo("stakeMaturity");
  }, [transitionTo]);

  return {
    onClickIncreaseStake,
    onClickDisburseStake,
    onClickConfirmFollowing,
    onClickStartStopDissolving,
    onClickAutoStakeMaturity,
    onClickFollow,
    onClickSplitNeuron,
    onClickAddHotKey,
    onClickRemoveHotKey,
    onClickSpawnNeuron,
    onClickSetDissolveDelay,
    onClickStakeMaturity,
  };
}
