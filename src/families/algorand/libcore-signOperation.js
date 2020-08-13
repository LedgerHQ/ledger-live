// @flow

import { makeSignOperation } from "../../libcore/signOperation";
import buildTransaction from "./libcore-buildTransaction";
import type { Transaction, CoreAlgorandTransaction } from "./types";
import Algorand from "./ledger-app/Algorand";
import { BigNumber } from "bignumber.js";

async function signTransaction({
  account: { freshAddressPath, spendableBalance, id, freshAddress },
  transport,
  transaction,
  coreTransaction,
  isCancelled,
  onDeviceSignatureGranted,
  onDeviceSignatureRequested,
}) {
  const hwApp = new Algorand(transport);
  const serialized = await coreTransaction.serialize();

  onDeviceSignatureRequested();
  // Call the hw-app signature
  // Note: That wont work until we dont change the code with the right call for Algorand
  // the code = ./ledger-app/Algorand
  const { signature } = await hwApp.sign(freshAddressPath, serialized);
  onDeviceSignatureGranted();

  if (!signature) {
    throw new Error("No signature");
  }

  // Set signature here
  await coreTransaction.setSignature(signature.toString("hex"));
  if (isCancelled()) return;

  // Get the serialization after signature to send it to broadcast
  const hex = await coreTransaction.serialize();

  if (isCancelled()) return;

  const type = transaction.mode === "optIn" ? "OPT_IN" : "OUT";

  // Add fees, senders (= account.freshAddress) and recipients.
  const senders = [freshAddress];
  const recipients = [transaction.recipient];
  const fee = await coreTransaction.getFee();
  const { subAccountId } = transaction;

  const op = {
    id: `${id}--${type}`,
    hash: "",
    type,
    value: subAccountId
      ? BigNumber(fee)
      : transaction.useAllAmount
      ? spendableBalance
      : transaction.amount.plus(fee),
    fee: BigNumber(fee),
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: id,
    date: new Date(),
    extra: {},
  };

  return {
    operation: op,
    expirationDate: null,
    signature: hex,
  };
}

export default makeSignOperation<Transaction, CoreAlgorandTransaction>({
  buildTransaction,
  signTransaction,
});
