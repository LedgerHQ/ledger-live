import { TX, Address, Block } from "../storage/types";

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  baseUrl: string;
  broadcast(tx: string): Promise<{ data: { result: string } }>;
  getTxHex(txId: string): Promise<string>;
  getFees(): Promise<{ [key: string]: number }>;
  getRelayFee(): Promise<number>;
  getCurrentBlock(): Promise<Block | null>;
  getBlockByHeight(height: number): Promise<Block | null>;
  getPendings(address: Address, nbMax?: number): Promise<TX[]>;
  getTxsSinceBlockheight(
    batchSize: number,
    address: Address,
    startingBlockheight: number,
    isPending: boolean,
  ): Promise<TX[]>;
}
