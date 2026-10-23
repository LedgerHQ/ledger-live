/* eslint-disable */
// Vendored verbatim from @dfinity/ledger-icp v2.6.13 (Apache-2.0), dist/candid/index.d.ts — the
// subset of the index canister's generated TypeScript types that index.idl.ts decodes into. Kept
// beside the vendored factory so the two stay in step. Do not edit by hand; refresh from the
// published package when the interface changes.

export interface GetAccountIdentifierTransactionsResponse {
  balance: bigint;
  transactions: Array<TransactionWithId>;
  oldest_tx_id: [] | [bigint];
}
export type Operation =
  | {
      Approve: {
        fee: Tokens;
        from: string;
        allowance: Tokens;
        expected_allowance: [] | [Tokens];
        expires_at: [] | [TimeStamp];
        spender: string;
      };
    }
  | {
      Burn: { from: string; amount: Tokens; spender: [] | [string] };
    }
  | { Mint: { to: string; amount: Tokens } }
  | {
      Transfer: {
        to: string;
        fee: Tokens;
        from: string;
        amount: Tokens;
        spender: [] | [string];
      };
    };
export interface TimeStamp {
  timestamp_nanos: bigint;
}
export interface Tokens {
  e8s: bigint;
}
export interface Transaction {
  memo: bigint;
  icrc1_memo: [] | [Uint8Array | number[]];
  operation: Operation;
  timestamp: [] | [TimeStamp];
  created_at_time: [] | [TimeStamp];
}
export interface TransactionWithId {
  id: bigint;
  transaction: Transaction;
}
