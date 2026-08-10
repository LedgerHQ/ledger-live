export interface IndexerResponseRoot<T> {
  data: T[];
  page_count: number;
  item_count: number;
}

/**
 * Arguments of a native CSPR transfer. The feed also serves staking, bid and contract deploys,
 * whose arguments are a different shape entirely — hence `Partial` on `ITxnHistoryData.args`.
 */
export interface TransferArgs {
  /** Motes, decimal string. */
  amount: {
    parsed: string;
    cl_type: string;
  };
  /**
   * Omitted, or present as `null`, when the transfer carries no id. Ids are U64 but the indexer
   * serialises them as JSON numbers, so anything above `Number.MAX_SAFE_INTEGER` is lossy — it
   * arrives already rounded and we cannot recover it. Since the id is shown to the user and used
   * to match exchange deposits, those few are displayed wrong rather than merely missing.
   */
  id?: {
    parsed?: number | null;
    cl_type: { Option: string };
  };
  /** An account hash when `cl_type` is `{ ByteArray: 32 }`, a public key when it is "PublicKey". */
  target: {
    parsed: string;
    cl_type: { ByteArray: number } | string;
  };
}

/** One record of `GET /accounts/{publicKey}/ledgerlive-deploys`, limited to the fields we consume. */
export interface ITxnHistoryData {
  deploy_hash: string;
  block_hash: string;
  block_height: number;
  caller_public_key: string;
  /** Motes actually charged, decimal string. `"0"` when the deploy failed before execution. */
  cost: string;
  /** Set only when the deploy failed; `status` is "processed" either way, so it carries no signal. */
  error_message?: string | null;
  /** ISO 8601, second resolution (e.g. "2022-11-18T15:38:19Z"). */
  timestamp: string;
  args: Partial<TransferArgs>;
}

export interface RpcError extends Error {
  statusCode: number;
}
