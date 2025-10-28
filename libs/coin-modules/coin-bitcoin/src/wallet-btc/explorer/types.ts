import { TX, Address, Block, Output } from "../storage/types";

export type NetworkInfoResponse = {
  relay_fee: string; // BTC per kB, e.g. "0.00001000"
  incremental_fee: string; // BTC per kB
  version: string; // e.g. "290000"
  subversion: string; // e.g. "/Satoshi:29.0.0/"
};

export type AtlasUtxo = {
  height: number;
  txIndex: number;
  outputIndex: number;
  txId: string;
  value: string;
  hex: string;
  type: string;
  owner: string;
};

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  baseUrl: string;
  broadcast(tx: string): Promise<{ data: { result: string } }>;
  getTxHex(txId: string): Promise<string>;
  getFees(): Promise<{ [key: string]: number }>;
  getNetwork?(): Promise<NetworkInfoResponse>;
  getCurrentBlock(): Promise<Block | null>;
  getBlockByHeight(height: number): Promise<Block | null>;
  getPendings(address: Address, nbMax?: number): Promise<TX[]>;
  getUnspentUtxos(address: Address): Promise<Output[]>;
  getTxsSinceBlockheight(
    batchSize: number,
    address: Address,
    fromBlockheight: number,
    toBlockheight: number | undefined,
    isPending: boolean,
    token: string | null,
  ): Promise<{ txs: TX[]; nextPageToken: string | null }>;
}
