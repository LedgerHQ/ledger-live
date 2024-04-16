/**
 */
export interface TransactionInput {
  prevout: Buffer;
  script: Buffer;
  sequence: Buffer;
  tree?: Buffer;
}

/**
 */
export interface TransactionOutput {
  amount: Buffer;
  script: Buffer;
}

/**
 */
export interface Transaction {
  // Each transaction is prefixed by a four-byte transaction version number
  // which tells Bitcoin peers and miners which set of rules to use to validate it.
  version: Buffer;
  inputs: TransactionInput[];
  outputs?: TransactionOutput[];
  // locktime indicates the earliest time or earliest block when that transaction may
  // be added to the block chain.
  locktime?: Buffer;
  witness?: Buffer;
  // timestamp is used only for peercoin but it is no longer necessary anymore
  timestamp?: Buffer;
  // nVersionGroupId is used only for Zcash, different version of Zcash has different nVersionGroupId
  // refer to https://github.com/zcash/zcash/blob/master/src/primitives/transaction.h for more details
  nVersionGroupId?: Buffer;
  // nExpiryHeight is used only for Decred and Zcash and ZenCash.
  // It sets the block height after which transactions will be removed
  // from the mempool if they have not been mined
  // refer to https://zips.z.cash/zip-0203 for more details
  nExpiryHeight?: Buffer;
  // extraData is used only for Zcash and ZenCash and komodo
  extraData?: Buffer;
}

export interface TrustedInput {
  trustedInput: boolean;
  value: Buffer;
  sequence: Buffer;
}
