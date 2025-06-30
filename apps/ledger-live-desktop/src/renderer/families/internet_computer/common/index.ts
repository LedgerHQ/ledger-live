import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { reassignOperationType } from "@ledgerhq/live-common/families/internet_computer/utils";
import {
  ICPAccount,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Dispatch } from "redux";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";

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
