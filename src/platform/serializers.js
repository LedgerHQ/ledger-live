// @flow
import { fromSignedOperationRaw, toSignedOperationRaw } from "../transaction";
import type {
  RawPlatformAccount,
  RawPlatformTransaction,
  RawPlatformEthereumTransaction,
  RawPlatformBitcoinTransaction,
  RawPlatformSignedTransaction,
} from "./rawTypes";
import type {
  PlatformAccount,
  PlatformTransaction,
  PlatformEthereumTransaction,
  PlatformBitcoinTransaction,
  PlatformSignedTransaction,
} from "./types";
import { BigNumber } from "bignumber.js";
export function serializePlatformAccount(
  account: PlatformAccount
): RawPlatformAccount {
  return {
    id: account.id,
    name: account.name,
    address: account.address,
    currency: account.currency,
    balance: account.balance.toString(),
    spendableBalance: account.spendableBalance.toString(),
    blockHeight: account.blockHeight,
    lastSyncDate: account.lastSyncDate.toString(),
  };
}
export function deserializePlatformAccount(
  rawAccount: RawPlatformAccount
): PlatformAccount {
  return {
    id: rawAccount.id,
    name: rawAccount.name,
    address: rawAccount.address,
    currency: rawAccount.currency,
    balance: new BigNumber(rawAccount.balance),
    spendableBalance: new BigNumber(rawAccount.spendableBalance),
    blockHeight: rawAccount.blockHeight,
    lastSyncDate: new Date(rawAccount.lastSyncDate),
  };
}
export function serializePlatformEthereumTransaction(
  transaction: PlatformEthereumTransaction
): RawPlatformEthereumTransaction {
  return {
    family: transaction.family,
    amount: transaction.amount.toString(),
    recipient: transaction.recipient,
    nonce: transaction.nonce,
    data: transaction.data ? transaction.data.toString("hex") : undefined,
    gasPrice: transaction.gasPrice
      ? transaction.gasPrice.toString()
      : undefined,
    gasLimit: transaction.gasLimit
      ? transaction.gasLimit.toString()
      : undefined,
  };
}
export function deserializePlatformEthereumTransaction(
  rawTransaction: RawPlatformEthereumTransaction
): PlatformEthereumTransaction {
  return {
    family: rawTransaction.family,
    amount: new BigNumber(rawTransaction.amount),
    recipient: rawTransaction.recipient,
    nonce: rawTransaction.nonce,
    data: rawTransaction.data
      ? Buffer.from(rawTransaction.data, "hex")
      : undefined,
    gasPrice: rawTransaction.gasPrice
      ? new BigNumber(rawTransaction.gasPrice)
      : undefined,
    gasLimit: rawTransaction.gasLimit
      ? new BigNumber(rawTransaction.gasLimit)
      : undefined,
  };
}
export function serializePlatformBitcoinTransaction(
  transaction: PlatformBitcoinTransaction
): RawPlatformBitcoinTransaction {
  return {
    family: transaction.family,
    amount: transaction.amount.toString(),
    recipient: transaction.recipient,
    feePerByte: transaction.feePerByte
      ? transaction.feePerByte.toString()
      : undefined,
  };
}
export function deserializePlatformBitcoinTransaction(
  rawTransaction: RawPlatformBitcoinTransaction
): PlatformBitcoinTransaction {
  return {
    family: rawTransaction.family,
    amount: new BigNumber(rawTransaction.amount),
    recipient: rawTransaction.recipient,
    feePerByte: rawTransaction.feePerByte
      ? new BigNumber(rawTransaction.feePerByte)
      : undefined,
  };
}
export function serializePlatformTransaction(
  transaction: PlatformTransaction
): RawPlatformTransaction {
  switch (transaction.family) {
    case "ethereum":
      return serializePlatformEthereumTransaction(transaction);
    case "bitcoin":
      return serializePlatformBitcoinTransaction(transaction);
    default:
      throw new Error(`Can't serialize ${transaction.family} transactions`);
  }
}
export function deserializePlatformTransaction(
  rawTransaction: RawPlatformTransaction
): PlatformTransaction {
  switch (rawTransaction.family) {
    case "ethereum":
      return deserializePlatformEthereumTransaction(rawTransaction);
    case "bitcoin":
      return deserializePlatformBitcoinTransaction(rawTransaction);
    default:
      throw new Error(`Can't deserialize transaction: family not supported`);
  }
}
export function serializePlatformSignedTransaction(
  signedTransaction: PlatformSignedTransaction
): RawPlatformSignedTransaction {
  return toSignedOperationRaw(signedTransaction, true);
}
export function deserializePlatformSignedTransaction(
  rawSignedTransaction: RawPlatformSignedTransaction,
  accountId: string
): PlatformSignedTransaction {
  return fromSignedOperationRaw(rawSignedTransaction, accountId);
}
