export interface AccountTransactionToolAccount {
  readonly accountUUID: string;
  /** The network and the descriptor's purpose, e.g. `ethereum · mock`. */
  readonly label: string;
  /** The assets the account holds, its native coin first. */
  readonly assetIds: readonly string[];
  /** Mock accounts sign with a simulated signature; device signing of the others is not wired yet. */
  readonly canSign: boolean;
}

/** The form as typed: JSON fields stay strings until the host parses them. */
export interface AccountTransactionToolRequest {
  readonly assetId: string;
  readonly recipient: string;
  /** In the asset's smallest unit. */
  readonly amount: string;
  readonly useAllAmount: boolean;
  readonly feeStrategy: string;
  /** A JSON object, e.g. `{"maxFeePerGas":"30000000000"}`. */
  readonly customFees: string;
  readonly feeAssetId: string;
  readonly memo: string;
  readonly memoType: string;
  /** A JSON object, e.g. `{"rbf":true}`. */
  readonly familyOptions: string;
}

export interface AccountTransactionToolPrepared {
  readonly preparationId: string;
  readonly sourceId: string;
  readonly amount: string;
  readonly fees: string;
  readonly feeAssetId: string;
  readonly totalSpent: string;
  /** `name (field)`, signing is blocked while non-empty. */
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface AccountTransactionToolFeeEstimate {
  readonly strategy: string;
  readonly fees: string;
  readonly feeAssetId: string;
}

export interface AccountTransactionToolBroadcasted {
  readonly hash: string;
  /** How many pending rows the account's operations got. */
  readonly pendingRows: number;
}

export interface AccountTransactionToolProps {
  readonly accounts: readonly AccountTransactionToolAccount[];
  /** Rejects with a readable message: invalid request, no source sending from the account… */
  readonly onPrepare: (
    accountUUID: string,
    request: AccountTransactionToolRequest,
  ) => Promise<AccountTransactionToolPrepared>;
  readonly onEstimateFees: (
    accountUUID: string,
    request: AccountTransactionToolRequest,
    strategies: readonly string[],
  ) => Promise<readonly AccountTransactionToolFeeEstimate[]>;
  readonly onSignAndBroadcast: (
    preparationId: string,
  ) => Promise<AccountTransactionToolBroadcasted>;
  readonly onRelease: (preparationId: string) => void;
}
