// @flow

import { BigNumber } from "bignumber.js";
import Xrp from "@ledgerhq/hw-app-xrp";
import type { Operation } from "../../types";
import type { CoreRippleLikeTransaction, Transaction } from "./types";
import { makeSignOperation } from "../../libcore/signOperation";
import buildTransaction from "./libcore-buildTransaction";
import {
  libcoreBigIntToBigNumber,
  libcoreAmountToBigNumber,
} from "../../libcore/buildBigNumber";

async function signTransaction({
  account: { freshAddress, freshAddressPath, id: accountId, balance },
  transport,
  transaction,
  coreTransaction,
  onDeviceSignatureRequested,
  onDeviceSignatureGranted,
}) {
  const hwApp = new Xrp(transport);
  const serialized = await coreTransaction.serialize();

  onDeviceSignatureRequested();
  const result = await hwApp.signTransaction(freshAddressPath, serialized);
  onDeviceSignatureGranted();

  await coreTransaction.setDERSignature(result);

  const signature = await coreTransaction.serialize();

  // build optimistic update

  const txHash = ""; // will be resolved at broadcast() time
  const senders = [freshAddress];
  const receiver = await coreTransaction.getReceiver();
  const recipients = [await receiver.toBase58()];
  const feeRaw = await coreTransaction.getFees();
  const fee = await libcoreAmountToBigNumber(feeRaw);
  const tag = await coreTransaction.getDestinationTag();
  const transactionSequenceNumberRaw = await coreTransaction.getSequence();
  const transactionSequenceNumber = (
    await libcoreBigIntToBigNumber(transactionSequenceNumberRaw)
  ).toNumber();

  const operation: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    type: "OUT",
    value: transaction.useAllAmount
      ? balance.minus(
          transaction.networkInfo ? transaction.networkInfo.baseReserve : 0
        )
      : BigNumber(transaction.amount || 0).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId,
    date: new Date(),
    transactionSequenceNumber,
    extra: {
      tag,
    },
  };

  return {
    signature,
    operation,
    expirationDate: null, // TODO
  };
}

export default makeSignOperation<Transaction, CoreRippleLikeTransaction>({
  signTransaction,
  buildTransaction,
});
