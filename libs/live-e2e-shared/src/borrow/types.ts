export type BorrowAction = "supply" | "borrow" | "repay" | "withdraw";

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
