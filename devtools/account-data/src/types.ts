/** Enough of a unit to render an amount: how many decimals, and what to call it. */
export interface AmountUnit {
  readonly code: string;
  readonly magnitude: number;
}

export interface ReadStatus {
  readonly pending: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  /** When the stored head was read, in ms since epoch. */
  readonly readAt?: number;
}

/** One asset of an account: the balance entity's row, joined with the countervalues for display. */
export interface AssetRow {
  readonly assetId: string;
  readonly unit?: AmountUnit;
  readonly balance: string;
  readonly spendable: string;
  /** In the fiat's smallest unit; absent without a rate. */
  readonly value?: number;
  /** Change of the asset's rate over the last 24 hours, as a ratio; absent without both rates. */
  readonly trend?: number;
}

export interface OperationRow {
  readonly id: string;
  readonly date: string;
  readonly type: string;
  readonly assetId: string;
  readonly unit?: AmountUnit;
  readonly value: string;
  readonly hash: string;
}

export interface AccountDataRow {
  readonly accountUUID: string;
  readonly name: string;
  readonly currencyId: string;
  readonly address: string;
  readonly assets: readonly AssetRow[];
  readonly balanceStatus: ReadStatus;
  readonly operations: readonly OperationRow[];
  readonly operationsStatus: ReadStatus;
  readonly hasMoreOperations: boolean;
  readonly operationsTotal?: number;
}

export interface AccountDataToolProps {
  readonly accounts: readonly AccountDataRow[];
  /** The fiat values are in. */
  readonly fiat?: AmountUnit;
  readonly onReadBalance: (accountUUID: string) => void;
  readonly onReadOperations: (accountUUID: string) => void;
  readonly onLoadMoreOperations: (accountUUID: string) => void;
  /** Reads every account's balance at once, respecting freshness, as a portfolio mount would. */
  readonly onReadAll: () => void;
}
