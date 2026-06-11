import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { TX, Address, Block } from "../storage/types";

export type NetworkInfoResponse = {
  relay_fee: string; // BTC per kB, e.g. "0.00001000"
  incremental_fee: string; // BTC per kB
  version: string; // e.g. "290000"
  subversion: string; // e.g. "/Satoshi:29.0.0/"
};
export type UtxoTxOutput = {
  output_index: number;
  spent_at_height: number | null;
} & Record<string, unknown>;

export type UtxoTx = {
  outputs: UtxoTxOutput[];
} & Record<string, unknown>;

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  baseUrl: string;
  broadcast(
    tx: string,
    broadcastConfig?: Pick<BroadcastConfig, "source">,
  ): Promise<{ data: { result: string } }>;
  getTxHex(txId: string): Promise<string>;
  getFees(): Promise<{ [key: string]: number }>;
  getNetwork?(): Promise<NetworkInfoResponse>;
  getCurrentBlock(): Promise<Block | null>;
  getBlockByHeight(height: number): Promise<Block | null>;
  getPendings(address: Address, nbMax?: number): Promise<TX[]>;
  fetchUtxoTx(hash: string): Promise<UtxoTx>;
  getTxBlockHeight(hash: string): Promise<number | null>;
  getTxsSinceBlockheight(
    batchSize: number,
    address: Address,
    fromBlockheight: number,
    toBlockheight: number | undefined,
    isPending: boolean,
    token: string | null,
  ): Promise<{ txs: TX[]; nextPageToken: string | null }>;
}
