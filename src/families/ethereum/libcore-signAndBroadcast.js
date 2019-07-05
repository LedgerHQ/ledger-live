// @flow

import { BigNumber } from "bignumber.js";
import type { Operation, Transaction, Account } from "../../types";
import type { CoreEthereumLikeTransaction } from "./types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import { getEnv } from "../../env";

async function ethereum({
  account: { id: accountId, freshAddress, balance, tokenAccounts },
  signedTransaction,
  builded,
  coreAccount,
  transaction
}: {
  account: Account,
  signedTransaction: string,
  builded: CoreEthereumLikeTransaction,
  coreAccount: CoreAccount,
  transaction: Transaction
}) {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();

  const txHash = getEnv("DISABLE_TRANSACTION_BROADCAST")
    ? ""
    : await ethereumLikeAccount.broadcastRawTransaction(signedTransaction);
  const senders = [freshAddress];
  const receiver = await builded.getReceiver();
  const recipients = [await receiver.toEIP55()];
  const gasPrice = await libcoreAmountToBigNumber(await builded.getGasPrice());
  const gasLimit = await libcoreAmountToBigNumber(await builded.getGasLimit());
  const fee = gasPrice.times(gasLimit);
  const transactionSequenceNumber = await builded.getNonce();

  const op: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    transactionSequenceNumber,
    type: "OUT",
    value: transaction.tokenAccountId
      ? fee
      : transaction.useAllAmount
      ? balance
      : BigNumber(transaction.amount || 0).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId,
    date: new Date(),
    extra: {}
  };

  const { tokenAccountId } = transaction;
  if (tokenAccountId) {
    const tokenAccount = (tokenAccounts || []).find(
      a => a.id === tokenAccountId
    );
    op.subOperations = [
      {
        id: `${tokenAccountId}-${txHash}-OUT`,
        hash: txHash,
        transactionSequenceNumber,
        type: "OUT",
        value:
          transaction.useAllAmount && tokenAccount
            ? tokenAccount.balance
            : BigNumber(transaction.amount || 0),
        fee,
        blockHash: null,
        blockHeight: null,
        senders,
        recipients: [transaction.recipient],
        accountId: tokenAccountId,
        date: new Date(),
        extra: {}
      }
    ];
  }

  return op;
}

export default ethereum;
