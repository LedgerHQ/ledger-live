// @flow

import type { BigNumber } from "bignumber.js";

export type OperationType =
  | "IN"
  | "OUT"
  | "NONE"
  | "CREATE"
  | "REVEAL"
  | "DELEGATE"
  | "UNDELEGATE"
  | "FREEZE"
  | "UNFREEZE"
  | "VOTE"
  | "REWARD";

export type Operation = {
  // unique identifier (usually hash)
  id: string,

  // transaction hash
  hash: string,

  // the direction of the operation
  // IN when funds was received (means the related account is in the recipients)
  // OUT when funds was sent (means the related account is in the senders)
  // NONE means this is not an operation related to the account but exists because there is likely an internal transaction
  type: OperationType,

  // this is the atomic value of the operation. it is always positive (later will be a BigInt)
  // in "OUT" case, it includes the fees. in "IN" case, it excludes them.
  value: BigNumber,

  // fee of the transaction (in satoshi value)
  fee: BigNumber,

  // senders & recipients addresses
  senders: string[],
  recipients: string[],

  // if block* are null, the operation is not yet on the blockchain

  // the height of the block on the blockchain (number)
  blockHeight: ?number,
  // the hash of the block the operation is in
  blockHash: ?string,

  // if available, this is the sequence number of the transaction in blockchains (aka "nonce" in Ethereum)
  transactionSequenceNumber?: number,

  // the account id. available for convenient reason
  accountId: string,

  // --------------------------------------------- specific operation raw fields

  // transaction date
  date: Date,

  // Extra crypto specific fields
  extra: Object,

  // Has the transaction actually failed? (some blockchain like ethereum will have failed tx appearing)
  hasFailed?: boolean,

  // in context of accounts that can have tokens, an operation can contains itself operations
  // these are not in raw at all because they are meant to be rebuilt from the references
  subOperations?: Operation[],

  // in context of accounts that have internal transactions that belong to a parent transaction
  // we have internal operations. Those are not included in the top level operations but can be presented to UI at that same level
  internalOperations?: Operation[]
};

export type OperationRaw = {
  id: string,
  hash: string,
  type: OperationType,
  value: string,
  fee: string,
  senders: string[],
  recipients: string[],
  blockHeight: ?number,
  blockHash: ?string,
  transactionSequenceNumber?: number,
  accountId: string,
  hasFailed?: boolean,
  // --------------------------------------------- specific operation raw fields
  date: string,
  extra: Object, // would be a serializable version of the extra
  subOperations?: OperationRaw[],

  // in context of accounts that have internal transactions that belong to a parent transaction
  // we have internal operations. Those are not included in the top level operations but can be presented to UI at that same level
  internalOperations?: OperationRaw[]
};
