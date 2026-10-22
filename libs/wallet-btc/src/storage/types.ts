import type { Logger } from "@ledgerhq/coin-module-framework/config";

export interface TX {
  id: string;
  hash?: string;
  account: number;
  index: number;
  received_at: string;
  block: Block | null;
  address: string;
  inputs: Input[];
  outputs: Output[];
  fees?: number;
}

export interface Input {
  value: string;
  address?: string;
  output_hash?: string;
  output_index: number;
  sequence: number;
  block_height?: number | null;
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
  appendTxs(logger: Logger, txs: TX[]): number;
  getAddressUnspentUtxos(address: Address): Output[];
  getLastConfirmedTxBlock(txFilter: { account: number; index: number }): Block | null;
  hasTx(txFilter: { account: number; index: number }): boolean;
  hasPendingTx(txFilter: { account: number; index: number }): boolean;
  getLastUnconfirmedTx(): TX | undefined;
  getHighestBlockHeightAndHash(): Block | null;
  getTx(address: string, txId: string): TX | undefined;
  getTxs(): TX[];
  getUniquesAddresses(addressesFilter: { account?: number; index?: number }): Address[];
  removeTxs(logger: Logger, txsFilter: { account: number; index: number }): void;
  removePendingTxs(logger: Logger, txsFilter: { account: number; index: number }): void;
  addAddress(key: string, address: string): void;
  export(): Promise<unknown>;
  load(logger: Logger, data: unknown): Promise<void>;
  exportSync(): unknown;
  loadSync(logger: Logger, data: unknown): void;
}
