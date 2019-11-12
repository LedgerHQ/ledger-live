// @flow

import type { Account, Operation } from "../../types";
import { getEnv } from "../../env";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import type { CoreTezosLikeTransaction, Transaction } from "./types";
import type { CoreAccount } from "../../libcore/types";

async function tezos({
  account: { id, balance },
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

  const accountId = transaction.subAccountId || id;

  // FIXME we do not correctly handle subAccount
  const op: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    type:
      transaction.mode === "undelegate" || transaction.mode === "delegate"
        ? "DELEGATE"
        : "OUT",
    value: transaction.useAllAmount ? balance : transaction.amount.plus(fee),
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

export default tezos;
