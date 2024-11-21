export type BlockInfo = {
  height: number;
  hash: string;
  time: Date;
};

export type Operation = {
  hash: string;
  address: string;
  type: string;
  value: bigint;
  fee: bigint;
  blockHeight: number;
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

export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  craftTransaction: (address: string, transaction: Transaction, pubkey?: string) => Promise<string>;
  estimateFees: (addr: string, amount: bigint) => Promise<bigint>;
  getBalance: (address: string) => Promise<bigint>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (address: string, blockHeight: number) => Promise<Operation[]>;
};
