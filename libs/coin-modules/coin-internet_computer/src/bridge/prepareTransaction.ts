import { AccountBridge } from "@ledgerhq/types-live";
import { getRandomTransferID } from "../common-logic/utils";
import {
  getNeuronStakeSubAccountIdentifier,
  recoverStakeMemo,
} from "../logic/buildNeuronTransaction";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import { validateAddress } from "../logic/validation";
import { ICPAccount, InternetComputerOperation, Transaction } from "../types";
import { getAddress } from "./bridgeHelpers/addresses";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const { address } = getAddress(account);
  let tx = transaction;

  if (tx.type === "create_neuron" && !tx.recipient && account.xpub) {
    // Derive the fresh neuron's governance subaccount and stake to it. The nonce is both the
    // transfer memo (so this creating transfer is later recoverable) and the claim nonce.
    const controller = derivePrincipalFromPubkey(account.xpub);
    const nonce = getRandomTransferID();
    tx = {
      ...tx,
      recipient: getNeuronStakeSubAccountIdentifier(controller, BigInt(nonce)),
      memo: nonce,
      stakeNonce: nonce,
    };
  } else if (tx.type === "increase_stake" && account.xpub) {
    // Top up an existing neuron: transfer (memo 0, so sync classifies it TOP_UP_NEURON) and recover
    // the stake nonce from history so broadcast can refresh it permissionlessly (no second
    // signature). stakeNonce stays unset when unrecoverable, and getTransactionStatus rejects it.
    const neuron = (account as ICPAccount).neurons?.fullNeurons.find(
      n => n.id?.toString() === tx.neuronId,
    );
    if (neuron) {
      const controller = derivePrincipalFromPubkey(account.xpub);
      const stakeNonce = recoverStakeMemo(
        account.operations as InternetComputerOperation[],
        neuron,
        controller,
      );
      // Force memo 0 (cleared) so a stale non-zero memo carried in from another flow can't push the
      // top-up transfer to STAKE_NEURON at sync time.
      tx = {
        ...tx,
        recipient: neuron.accountIdentifier,
        memo: undefined,
        ...(stakeNonce && { stakeNonce }),
      };
    }
  }

  if (
    tx.useAllAmount &&
    tx.recipient &&
    validateAddress(tx.recipient).isValid &&
    validateAddress(address).isValid
  ) {
    return { ...tx, amount: account.spendableBalance.minus(tx.fees) };
  }

  return tx;
};
