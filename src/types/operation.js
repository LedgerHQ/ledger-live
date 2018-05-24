// @flow

export type OperationType = "IN" | "OUT" | "SELF";

export type Operation = {
  // unique identifier (usually hash)
  id: string,

  // transaction hash
  hash: string,

  // the direction of the operation
  // IN when funds was received (means the related account is in the recipients)
  // OUT when funds was sent (means the related account is in the senders)
  // SELF means funds was exclusively send from the account to the same account.
  type: OperationType,

  // this is the atomic value of the operation. it is always positive (later will be a BigInt)
  value: number,

  // senders & recipients addresses
  senders: string[],
  recipients: string[],

  // if block* are null, the operation is not yet on the blockchain

  // the height of the block on the blockchain (number)
  blockHeight: ?number,
  // the hash of the block the operation is in
  blockHash: ?string,

  // the account id. available for convenient reason
  accountId: string,

  // --------------------------------------------- specific operation raw fields

  // transaction date
  date: Date
};

export type OperationRaw = {
  id: string,
  hash: string,
  type: OperationType,
  value: number,
  senders: string[],
  recipients: string[],
  blockHeight: ?number,
  blockHash: ?string,
  accountId: string,
  // --------------------------------------------- specific operation raw fields
  date: string
};
