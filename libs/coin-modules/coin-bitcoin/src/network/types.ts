/** Raw shapes served by the Ledger explorer v4 (`verbosity=Minimal`). */

export type ExplorerBlock = {
  height: number;
  hash: string;
  time: string;
};

export type ExplorerInput = {
  value: string | number;
  address?: string | null;
  output_hash?: string | null;
  output_index: number;
  sequence: number;
};

export type ExplorerOutput = {
  value: string | number;
  address?: string | null;
  output_index: number;
};

export type ExplorerTx = {
  id: string;
  received_at: string;
  block: ExplorerBlock | null;
  inputs: ExplorerInput[];
  outputs: ExplorerOutput[];
  fees?: string | number | null;
  lock_time?: number;
};

export type ExplorerTxsPage = {
  data: ExplorerTx[];
  token: string | null;
};

export type ExplorerUtxoTx = {
  outputs: Array<{ output_index: number; spent_at_height: number | null }>;
};

/** Raw `/fees` response: block targets to a fee rate in sat/kB, plus `last_updated`. */
export type ExplorerFees = Record<string, number>;

export type ExplorerNetwork = {
  /** BTC per kB, e.g. "0.00001000" */
  relay_fee?: string | null;
  /** BTC per kB */
  incremental_fee?: string | null;
};
