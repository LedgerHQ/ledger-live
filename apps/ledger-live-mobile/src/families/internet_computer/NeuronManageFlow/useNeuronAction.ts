import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type {
  ICPAccount,
  ICPNeuron,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useICPNeuronById } from "@ledgerhq/live-common/families/internet_computer/react";
import invariant from "invariant";
import { useCallback } from "react";
import { ScreenName } from "~/const";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type ActionRoute = {
  name: string;
  params: {
    accountId: string;
    neuronId: string;
    transaction: Transaction;
  };
};

type Navigation = {
  navigate: (screen: string, params: Record<string, unknown>) => void;
};

/**
 * Everything an action screen needs: the account, the neuron it addresses, and a live bridge
 * transaction seeded from the one its caller built.
 *
 * There is no stepper on mobile, so the transaction travels in route params and each screen re-runs
 * validation against the bridge. Screens only patch their own field — the transaction type and
 * neuron id were set when the action was chosen.
 */
export function useNeuronAction(navigation: Navigation, route: ActionRoute) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const neuron: ICPNeuron | undefined = useICPNeuronById(icpAccount, route.params.neuronId);
  const bridge = useAccountBridge<Transaction>(icpAccount);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction<Transaction>(bridge, () => ({
      account: icpAccount,
      transaction: route.params.transaction,
    }));

  const continueToDevice = useCallback(
    () =>
      navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
        ...route.params,
        transaction,
        status,
      }),
    [navigation, route.params, status, transaction],
  );

  return {
    account: icpAccount,
    neuron,
    // Exposed for the one case that cannot wait for `updateTransaction`: a screen that patches the
    // transaction and hands it straight to the next screen needs the patched value now, not after
    // the state settles.
    bridge,
    transaction,
    updateTransaction,
    status: status as TransactionStatus,
    bridgePending,
    bridgeError,
    continueToDevice,
  };
}
