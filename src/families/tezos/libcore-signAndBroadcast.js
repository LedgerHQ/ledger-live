// @flow

import invariant from "invariant";
import type { Account } from "../../types";
import { getEnv } from "../../env";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import type { CoreTezosLikeTransaction, Transaction } from "./types";
import type { CoreAccount } from "../../libcore/types";

async function tezos({
  account: { id, balance, subAccounts },
  signedTransaction,
  builded,
  coreAccount,
  transaction
}: {
  account: Account,
  signedTransaction: string,
  builded: CoreTezosLikeTransaction,
  coreAccount: CoreAccount,
  transaction: Transaction
}) {
  const tezosLikeAccount = await coreAccount.asTezosLikeAccount();

  const txHash = getEnv("DISABLE_TRANSACTION_BROADCAST")
    ? ""
    : await tezosLikeAccount.broadcastRawTransaction(signedTransaction);
  const receiver = await builded.getReceiver();
  const sender = await builded.getSender();
  const recipients = [
    transaction.mode === "undelegate" ? "" : await receiver.toBase58()
  ];
  const senders = [await sender.toBase58()];
  const feesRaw = await builded.getFees();
  const fee = await libcoreAmountToBigNumber(feesRaw);

  let op;

  const type =
    transaction.mode === "undelegate"
      ? "UNDELEGATE"
      : transaction.mode === "delegate"
      ? "DELEGATE"
      : "OUT";

  const subAccount = transaction.subAccountId
    ? (subAccounts || []).find(a => a.id === transaction.subAccountId)
    : null;
  if (!subAccount) {
    op = {
      id: `${id}-${txHash}-OUT`,
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
      extra: {}
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
          id: `${subAccount.id}-${txHash}-OUT`,
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
          extra: {}
        }
      ]
    };
  }

  return op;
}

export default tezos;
