export interface TX {
  hash: string;
  account: number;
  index: number;
  received_at: string;
  block: Block;
  address: string;
  inputs: Input[];
  outputs: Output[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fees?: any;
}

export interface Input {
  value: string;
  address: string;
  output_hash: string;
  output_index: number;
  sequence: number;
}

export interface Output {
  value: string;
  address: string;
  output_hash: string;
  output_index: number;
  block_height: number | null;
  // TODO Write tests for RBF unconfirmed outputs
  rbf: boolean;
}

export interface Block {
  height: number;
  hash: string;
  time: string;
}

export interface Address {
  account: number;
  index: number;
  address: string;
}

export interface IStorage {
  appendTxs(txs: TX[]): number;
  getAddressUnspentUtxos(address: Address): Output[];
  getLastTx(txFilter: {
    account?: number;
    index?: number;
    address?: string;
    confirmed?: boolean;
  }): TX | undefined;
  getTx(address: string, hash: string): TX | undefined;
  getUniquesAddresses(addressesFilter: {
    account?: number;
    index?: number;
  }): Address[];
  removeTxs(txsFilter: { account: number; index: number }): void;
  removePendingTxs(txsFilter: { account: number; index: number }): void;
  addAddress(key: string, address: string): void;
  export(): Promise<unknown>;
  load(data: unknown): Promise<void>;
  exportSync(): unknown;
  loadSync(data: unknown): void;
}
