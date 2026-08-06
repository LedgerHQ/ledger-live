export interface IndexerResponseRoot<T> {
  data: T[];
  page_count: number;
  item_count: number;
}

export interface ITxnHistoryData {
  deploy_hash: string;
  block_hash: string;
  block_height: number;
  /** Account hash of the caller. Equals blake2b256 of `caller_public_key`, verified against mainnet. */
  caller_hash: string;
  caller_public_key: string;
  /**
   * Populated on plain native transfers too (all observed records share a single contract hash),
   * so it must not be used to discriminate token operations.
   */
  contract_hash?: string | null;
  contract_package_hash?: string | null;
  entry_point_id: number;
  execution_type_id: number;
  runtime_type_id: number;
  pricing_mode_id: number;
  version_id: number;
  gas_price_limit: number;
  is_standard_payment: boolean;
  /** Motes, decimal string. Parse with BigInt — Number loses precision at CSPR scale. */
  cost: string;
  consumed_gas: string;
  payment_amount: string;
  refund_amount: string;
  error_message?: string | null;
  status: string;
  /** ISO 8601, second resolution — no milliseconds (e.g. "2022-11-18T15:38:19Z"). */
  timestamp: string;
  args: {
    id?: {
      /**
       * Casper transfer ids are U64, but the indexer serialises them as JSON numbers, so values
       * above Number.MAX_SAFE_INTEGER are already lossy before this code sees them.
       */
      parsed?: number | null;
      cl_type: {
        Option: string;
      };
    };
    amount: {
      parsed: string;
      cl_type: string;
    };
    target: {
      /** An account hash when `cl_type` is `{ ByteArray: 32 }`, a public key when it is "PublicKey". */
      parsed: string;
      cl_type:
        | {
            ByteArray: number;
          }
        | string;
    };
  };
}

export interface RpcError extends Error {
  statusCode: number;
}
