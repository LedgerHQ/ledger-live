import { AxiosInstance } from "axios";
import { TX, Address, Block } from "../storage/types";

// abstract explorer api used, abstract batching logic, pagination, and retries
export interface IExplorer {
  underlyingClient: AxiosInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  broadcast(tx: string): Promise<any>;
  getTxHex(txId: string): Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFees(): Promise<any>;
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
