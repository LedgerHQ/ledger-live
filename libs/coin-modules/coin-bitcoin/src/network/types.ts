/** Ledger explorer (blockchain/v4) response shapes. Only the fields read by the module are mirrored. */

export type ExplorerBlock = {
  hash: string;
  height: number;
  /** ISO-8601 date. */
  time: string;
  txs: string[];
  /** Hash of the previous block, when the explorer provides it. */
  prevHash?: string | null;
};

export type ExplorerBalance = {
  address: string;
  /** Integer amount in the smallest unit, as a string. */
  balance: string;
};

export type ExplorerTxInput = {
  /** Id of the transaction that created the spent output (`tx/{hash}` responses). */
  output_tx_id?: string | null;
  output_hash?: string | null;
  output_index?: number | null;
  value?: string | null;
  address?: string | null;
  /** Set (script hex) on the input of a coinbase transaction. */
  coinbase?: string | null;
};

export type ExplorerTxOutput = {
  output_index: number;
  value: string;
  address?: string | null;
  spent_at_height?: number | null;
};

export type ExplorerTx = {
  /** Transaction id (`tx/{hash}` responses); `hash` may then be the witness hash. */
  id?: string | null;
  hash: string;
  /** Date the explorer first saw the transaction (ISO-8601). */
  received_at?: string | null;
  fees: string;
  /** `null` while the transaction is unconfirmed. */
  block?: { hash: string; height: number; time: string } | null;
  inputs: ExplorerTxInput[];
  outputs: ExplorerTxOutput[];
};

export type ExplorerBroadcastResponse = {
  result?: string | null;
};

export type TransactionSourceHeaders = {
  type: string;
  name: string;
};

export type ExplorerUtxo = {
  hash: string;
  outputIndex: number;
  /** Integer amount in the smallest unit, as a string. */
  value: string;
  /** Output script, hex. */
  hex: string;
  /** Block height; absent or `null` while the funding transaction is unconfirmed. */
  height?: number | null;
};

/** Mempool view of an address: outputs created and outputs spent by unconfirmed transactions. */
export type ExplorerPendingUtxos = {
  spent: ExplorerUtxo[];
  created: ExplorerUtxo[];
};

export type ExplorerUtxoPage = {
  data: ExplorerUtxo[];
  /** Cursor of the next page; `null` on the last one. */
  token?: string | null;
};

/** Fee rates in sat/kB, keyed by confirmation target (in blocks), plus a `last_updated` timestamp. */
export type ExplorerFees = Record<string, number>;

export type ExplorerNetworkInfo = {
  /** Minimum relay fee, in BTC/kB, as a decimal string. */
  relay_fee?: string | null;
};

export type ExplorerTxPage = {
  data: ExplorerTx[];
  /** Cursor of the next page; `null` on the last one. */
  token?: string | null;
};

export type ExplorerTxHex = {
  hex: string;
};
