import { TX, Address, Block } from "../storage/types";

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  baseUrl: string;
  broadcast(tx: string): Promise<{ data: { result: string } }>;
  getTxHex(txId: string): Promise<string>;
  getFees(): Promise<{ [key: string]: number }>;
  getNetwork?(): Promise<{
    relay_fee?: string; // BTC per kB
    incremental_fee?: string; // BTC per kB
    version?: string;
    subversion?: string;
  }>;
  getCurrentBlock(): Promise<Block | null>;
  getBlockByHeight(height: number): Promise<Block | null>;
  getPendings(address: Address, nbMax?: number): Promise<TX[]>;
  getTxsSinceBlockheight(
    batchSize: number,
    address: Address,
    fromBlockheight: number,
    toBlockheight: number | undefined,
    isPending: boolean,
    token: string | null,
  ): Promise<{ txs: TX[]; nextPageToken: string | null }>;
}
