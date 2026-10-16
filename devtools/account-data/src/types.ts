/** One kind's entry of the `accountData` status slice, as stored. */
export interface ReadStatus {
  readonly pending: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  /** When the stored head was read, in ms since epoch. */
  readonly readAt?: number;
  readonly queryKey?: string;
  readonly nextCursor?: string;
}

/** One row of the `accountBalances` slice, as stored: amounts in the asset's smallest unit. */
export interface BalanceRow {
  readonly assetId: string;
  readonly balance: string;
  readonly spendableBalance: string;
}

/** One row of the `accountOperations` slice, as stored. */
export interface OperationRow {
  readonly id: string;
  readonly assetId: string;
  readonly date: string;
  readonly type: string;
  readonly value: string;
  readonly fee: string;
  readonly hash: string;
  readonly blockHeight: number | null;
  readonly hasFailed?: boolean;
  readonly parentOperationId?: string;
}

/** One entry of the accounts slice, with what each account data store holds for it. */
export interface AccountDataRow {
  readonly accountUUID: string;
  readonly legacyId?: string;
  readonly network: string;
  /** The descriptor's address, or its xpub on a UTXO account. */
  readonly key: string;
  readonly path: string;
  /** Absent while the store holds nothing for the account. */
  readonly balanceStatus?: ReadStatus;
  readonly balances?: readonly BalanceRow[];
  readonly operationsStatus?: ReadStatus;
  readonly operations?: readonly OperationRow[];
  readonly operationsTotal?: number;
}

export interface AccountDataToolProps {
  readonly accounts: readonly AccountDataRow[];
  readonly onReadBalance: (accountUUID: string) => void;
  readonly onReadOperations: (accountUUID: string) => void;
  readonly onLoadMoreOperations: (accountUUID: string) => void;
  /** Reads every account's balance at once, respecting freshness, as a portfolio mount would. */
  readonly onReadAll: () => void;
}
