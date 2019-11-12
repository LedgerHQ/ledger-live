// @flow

import { BigNumber } from "bignumber.js";
import type { Operation } from "../../types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import { getEnv } from "../../env";

async function bitcoin({
  account: { id: accountId },
  signedTransaction,
  builded,
  coreAccount,
  transaction
}: *) {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();

  const txHash = getEnv("DISABLE_TRANSACTION_BROADCAST")
    ? ""
    : await bitcoinLikeAccount.broadcastRawTransaction(signedTransaction);

  const sendersInput = await builded.getInputs();
  const senders = (
    await Promise.all(sendersInput.map(senderInput => senderInput.getAddress()))
  ).filter(Boolean);

  const recipientsOutput = await builded.getOutputs();
  const recipients = (
    await Promise.all(
      recipientsOutput.map(recipientOutput => recipientOutput.getAddress())
    )
  ).filter(Boolean);

  const coreAmountFees = await builded.getFees();
  if (!coreAmountFees) {
    throw new Error("signAndBroadcast: fees should not be undefined");
  }
  const fee = await libcoreAmountToBigNumber(coreAmountFees);

  // NB we don't check isCancelled() because the broadcast is not cancellable now!
  const op: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    type: "OUT",
    value: BigNumber(transaction.amount).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId,
    date: new Date(),
    extra: {}
  };

  return op;
}

export default bitcoin;
