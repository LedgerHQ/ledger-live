import invariant from "invariant";
import Xtz from "@ledgerhq/hw-app-tezos";
import type { CoreTezosLikeTransaction, Transaction } from "./types";
import { makeSignOperation } from "../../libcore/signOperation";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";

async function signTransaction({
  account,
  transport,
  transaction,
  coreTransaction,
  isCancelled,
  onDeviceSignatureGranted,
  onDeviceSignatureRequested,
}) {
  const { freshAddressPath, balance, id, subAccounts } = account;
  // Sign with the device
  const hwApp = new Xtz(transport);
  const serialized = await coreTransaction.serialize();
  onDeviceSignatureRequested();
  const { signature } = await hwApp.signOperation(freshAddressPath, serialized);
  onDeviceSignatureGranted();
  if (isCancelled()) return;
  await coreTransaction.setSignature(signature);
  if (isCancelled()) return;
  const hex = await coreTransaction.serialize();
  if (isCancelled()) return;
  const receiver = await coreTransaction.getReceiver();
  if (isCancelled()) return;
  const sender = await coreTransaction.getSender();
  if (isCancelled()) return;
  const recipients = [
    transaction.mode === "undelegate" ? "" : await receiver.toBase58(),
  ];
  if (isCancelled()) return;
  const senders = [await sender.toBase58()];
  if (isCancelled()) return;
  const feesRaw = await coreTransaction.getFees();
  if (isCancelled()) return;
  const fee = await libcoreAmountToBigNumber(feesRaw);
  if (isCancelled()) return;
  // Make an optimistic response
  let op;
  const txHash = ""; // resolved in broadcast()

  const type =
    transaction.mode === "undelegate"
      ? "UNDELEGATE"
      : transaction.mode === "delegate"
      ? "DELEGATE"
      : "OUT";
  const subAccount =
    transaction.subAccountId && subAccounts
      ? subAccounts.find((a) => a.id === transaction.subAccountId)
      : null;

  if (!subAccount) {
    op = {
      id: `${id}-${txHash}-${type}`,
      hash: txHash,
      type,
      value: transaction.useAllAmount ? balance : transaction.amount.plus(fee),
      fee,
      blockHash: null,
      blockHeight: null,
      senders,
      recipients,
      accountId: id,
      date: new Date(),
      extra: {},
    };
  } else {
    invariant(
      subAccount.type === "ChildAccount",
      "tezos child account is ChildAccount"
    );
    op = {
      id: `${id}-${txHash}-OUT`,
      hash: txHash,
      type: "OUT",
      value: fee,
      fee,
      blockHash: null,
      blockHeight: null,
      senders,
      recipients: [subAccount.address],
      accountId: id,
      date: new Date(),
      extra: {},
      subOperations: [
        {
          id: `${subAccount.id}-${txHash}-${type}`,
          hash: txHash,
          type,
          value: transaction.useAllAmount
            ? subAccount.balance
            : transaction.amount,
          fee,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients: [transaction.recipient],
          accountId: subAccount.id,
          date: new Date(),
          extra: {},
        },
      ],
    };
  }

  return {
    operation: op,
    expirationDate: null,
    signature: hex,
  };
}

export default makeSignOperation<Transaction, CoreTezosLikeTransaction>({
  buildTransaction,
  signTransaction,
});
