import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { ResolvedAccountBridge } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import type { AppDispatch } from "~/state-manager/configureStore";

// Staking an ICP goes through the regular send flow: `create_neuron` debits the ledger canister the
// same way a transfer does. There is no validator to pick — prepareTransaction derives the neuron's
// governance subaccount as the recipient, and the nonce it stores there is also the memo. Both are
// protocol-derived, so the flow starts at the amount step with no way back into recipient entry.
// The bridge is resolved by the caller, since getAccountBridge is async and these are not hooks.
export const onClickStakeIcp = (
  dispatch: AppDispatch,
  account: ICPAccount,
  bridge: ResolvedAccountBridge<Transaction>,
) => {
  const transaction = bridge.createTransaction(account);
  dispatch(
    openModal("MODAL_SEND", {
      account,
      transaction: bridge.updateTransaction(transaction, { type: "create_neuron" }),
      stepId: "amount",
      disableBacks: ["amount"],
    }),
  );
};

export const onClickManageNeurons = (dispatch: AppDispatch, account: ICPAccount) => {
  dispatch(openModal("MODAL_ICP_LIST_NEURONS", { account }));
};
