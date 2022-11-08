import { AxiosInstance } from "axios";
import { TX, Address, Block } from "../storage/types";

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  underlyingClient: AxiosInstance;
  broadcast(tx: string): Promise<{ data: { result: string } }>;
  getTxHex(txId: string): Promise<string>;
  getFees(): Promise<{ [key: string]: number }>;
  getRelayFee(): Promise<number>;
  getCurrentBlock(): Promise<Block | null>;
  getBlockByHeight(height: number): Promise<Block | null>;
  getPendings(address: Address, nbMax?: number): Promise<TX[]>;
  getAddressTxsSinceLastTxBlock(
    batchSize: number,
    address: Address,
    lastTx: TX | undefined
  ): Promise<TX[]>;
}
