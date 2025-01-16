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
  supplement?: unknown;
};

export type Pagination = { limit: number; start?: number };
export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  craftTransaction: (address: string, transaction: Transaction, pubkey?: string) => Promise<string>;
  estimateFees: (addr: string, amount: bigint) => Promise<bigint>;
  getBalance: (address: string) => Promise<bigint>;
  lastBlock: () => Promise<BlockInfo>;
  /**
   *
   * @param address
   * @param pagination The max number of operation to receive and the "id" or "index" to start from (see returns value).
   * @returns Operations found and the next "id" or "index" to use for pagination (i.e. `start` property).\
   * If `0` is returns, no pagination needed.
   * This "id" or "index" value, thus it has functional meaning, is different for each blockchain.
   */
  listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], number]>;
};
