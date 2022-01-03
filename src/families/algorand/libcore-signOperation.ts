import Algorand from "@ledgerhq/hw-app-algorand";
import { makeSignOperation } from "../../libcore/signOperation";
import buildTransaction from "./libcore-buildTransaction";
import type { AlgorandTransaction, CoreAlgorandTransaction } from "./types";
import type { Operation } from "../../types";
import { BigNumber } from "bignumber.js";

async function signTransaction({
  account,
  transport,
  transaction,
  coreTransaction,
  isCancelled,
  onDeviceSignatureGranted,
  onDeviceSignatureRequested,
}) {
  const { freshAddressPath, spendableBalance, id, freshAddress, subAccounts } =
    account;
  const hwApp = new Algorand(transport);
  const serialized = await coreTransaction.serialize();
  onDeviceSignatureRequested();
  // Call the hw-app signature
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
  // Add fees, senders (= account.freshAddress) and recipients.
  const senders = [freshAddress];
  const recipients = [transaction.recipient];
  const fee = await coreTransaction.getFee();
  const { subAccountId } = transaction;

  const getType = () => {
    return subAccountId
      ? "FEES"
      : transaction.mode === "optIn"
      ? "OPT_IN"
      : "OUT";
  };

  const type = getType();
  const tokenAccount = !subAccountId
    ? null
    : subAccounts && subAccounts.find((ta) => ta.id === subAccountId);
  const op: Operation = {
    id: `${id}--${type}`,
    hash: "",
    type,
    value: subAccountId
      ? new BigNumber(fee)
      : transaction.useAllAmount
      ? spendableBalance
      : transaction.amount.plus(fee),
    fee: new BigNumber(fee),
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: id,
    date: new Date(),
    extra: {},
  };

  if (tokenAccount && subAccountId) {
    op.subOperations = [
      {
        id: `${subAccountId}--OUT`,
        hash: "",
        type: "OUT",
        value: transaction.useAllAmount
          ? tokenAccount.balance
          : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders,
        recipients,
        accountId: subAccountId,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return {
    operation: op,
    expirationDate: null,
    signature: hex,
  };
}

export default makeSignOperation<AlgorandTransaction, CoreAlgorandTransaction>({
  buildTransaction,
  signTransaction,
});
