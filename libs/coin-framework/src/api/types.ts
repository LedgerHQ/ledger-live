export type BlockInfo = {
  height: number;
  hash?: string;
  time?: Date;
};

export type Operation = {
  hash: string;
  address: string;
  type: string;
  value: bigint;
  fee: bigint;
  block: BlockInfo;
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber: number;
  // Field containing dedicated value for each blockchain
  details?: Record<string, unknown>;
};

export type Transaction = {
  type: string;
  recipient: string;
  amount: bigint;
  fee: bigint;
} & Record<string, unknown>; // Field containing dedicated value for each blockchain

// TODO add a `token: string` field to the pagination if we really need to support pagination (which is not the case for now)
export type Asset = {
  native: bigint;
};

// TODO rename start to minHeight
//       and add a `token: string` field to the pagination if we really need to support pagination
//       (which is not the case for now)
//       for now start is used as a minHeight from which we want to fetch ALL operations
//       limit is unused for now
//       see design document at https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/5446205788/coin-modules+lama-adapter+APIs+refinements
export type Pagination = { minHeight: number };
export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  craftTransaction: (address: string, transaction: Transaction, pubkey?: string) => Promise<string>;
  estimateFees: (addr: string, amount: bigint) => Promise<bigint>;
  getBalance: (address: string) => Promise<Asset | bigint>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], string]>;
};
