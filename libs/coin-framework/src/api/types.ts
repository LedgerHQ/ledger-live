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
};

export type Api = {
  broadcast: (tx: string) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string;
  craftTransaction: (
    address: string,
    transaction: {
      recipient: string;
      amount: bigint;
      fee: bigint;
    },
  ) => Promise<string>;
  estimateFees: (addr: string, amount: bigint) => Promise<bigint>;
  getBalance: (address: string) => Promise<bigint>;
  lastBlock: () => Promise<BlockInfo>;
  listOperations: (address: string, blockHeight: number) => Promise<Operation[]>;
};
