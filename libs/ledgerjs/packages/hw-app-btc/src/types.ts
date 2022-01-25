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
  version: Buffer;
  inputs: TransactionInput[];
  outputs?: TransactionOutput[];
  locktime?: Buffer;
  witness?: Buffer;
  timestamp?: Buffer;
  nVersionGroupId?: Buffer;
  nExpiryHeight?: Buffer;
  extraData?: Buffer;
}

export interface TrustedInput {
  trustedInput: boolean;
  value: Buffer;
  sequence: Buffer;
}
