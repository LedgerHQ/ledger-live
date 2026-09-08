/**
 * `supplyAndBorrow` is the bundled route the borrow live app posts; the driver opens a loan
 * with separate `supply` + `borrow` calls instead, and the two approve different spenders.
 */
export type BorrowAction = "supply" | "supplyAndBorrow" | "borrow" | "repay" | "withdraw";

export interface PartnerActionStep {
  transactionId: string;
  signablePayload: string;
  actionType: string;
}

export interface PartnerActionResponse {
  actionId: string;
  steps: PartnerActionStep[];
}

/**
 * JSON shape of a partner `signablePayload` (BorrowKit / yield.xyz). Mirrors
 * `borrow-live-app` `packages/ledger-sdk/src/web.ts` `YieldEvmPayload`.
 */
export interface EvmSignablePayload {
  from?: string;
  to: string;
  data?: string;
  value?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export interface OpenLoan {
  marketId: string;
  debtBalance?: string;
  collateralBalance?: string;
}
