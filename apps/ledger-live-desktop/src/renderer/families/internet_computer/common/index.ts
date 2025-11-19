import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { reassignOperationType } from "@ledgerhq/live-common/families/internet_computer/utils";
import {
  ICPAccount,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Dispatch } from "redux";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { openModal } from "~/renderer/actions/modals";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

export const refreshNeuronsData = (
  dispatch: Dispatch,
  account: ICPAccount,
  optimisticOperation: InternetComputerOperation,
) => {
  dispatch(
    updateAccountWithUpdater(account.id, account => {
      if (optimisticOperation.type !== "NONE") {
        account = addPendingOperation(account, optimisticOperation);
      }
      if (
        optimisticOperation.extra.neurons &&
        optimisticOperation.extra.neurons.fullNeurons.length > 0
      ) {
        const neuronAddresses = optimisticOperation.extra.neurons?.fullNeurons.map(
          neuron => neuron.accountIdentifier,
        );
        const ops = reassignOperationType(
          account.operations as InternetComputerOperation[],
          neuronAddresses ?? [],
        );
        return {
          ...account,
          operations: ops,
          neurons: optimisticOperation.extra.neurons,
        };
      }
      return account;
    }),
  );
};

export const onClickManageNeurons = (account: ICPAccount, dispatch: Function, refresh = false) => {
  if (account.type !== "Account") return;
  dispatch(
    openModal("MODAL_ICP_LIST_NEURONS", {
      account,
      refresh,
    }),
  );
};

export const onClickStakeIcp = (account: ICPAccount, dispatch: Function) => {
  const bridge = getAccountBridge(account);
  const initTx = bridge.createTransaction(account);

  const onConfirmationHandler = () => {
    dispatch(
      openModal("MODAL_ICP_LIST_NEURONS", {
        account,
        refresh: false,
        lastManageAction: "create_neuron",
        stepId: "confirmation",
      }),
    );
  };

  dispatch(
    openModal("MODAL_SEND", {
      stepId: "amount",
      account,
      onConfirmationHandler,
      transaction: {
        ...initTx,
        type: "create_neuron",
      },
    }),
  );
};

export const onClickConfirmFollowing = (account: ICPAccount, dispatch: Function) => {
  dispatch(
    openModal("MODAL_ICP_REFRESH_VOTING_POWER", {
      account,
    }),
  );
};
