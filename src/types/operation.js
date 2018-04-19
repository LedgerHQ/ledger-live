// @flow

/**
 *
 *                                 Operation
 *                                 ---------
 *
 */

export type Operation = {
  // unique identifier (usually hash)
  id: string,

  // transaction hash
  hash: string,

  // transaction address
  address: string,

  // transaction amount in satoshi
  amount: number,

  // blockHeight allows us to compute the confirmations number (currentBlockHeight - blockHeight)
  // if null, the operation is not yet on the blockchain
  blockHeight: number,

  // the account id. available for convenient reason
  accountId: string,

  // --------------------------------------------- specific operation raw fields

  // transaction date
  date: Date
};

export type OperationRaw = {
  // unique identifier (usually hash)
  id: string,

  // transaction hash
  hash: string,

  // transaction address
  address: string,

  // transaction amount in satoshi
  amount: number,

  // blockHeight allows us to compute the confirmations number (currentBlockHeight - blockHeight)
  // if null, the operation is not yet on the blockchain
  blockHeight: number,

  // the account id. available for convenient reason
  accountId: string,

  // --------------------------------------------- specific operation raw fields

  // transaction date
  date: string
};
