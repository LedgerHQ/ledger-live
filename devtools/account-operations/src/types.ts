export interface AmountUnit {
  readonly code: string;
  readonly magnitude: number;
}

export interface ListedOperation {
  readonly id: string;
  readonly type: string;
  readonly value: string;
  readonly assetId: string;
  readonly unit?: AmountUnit;
  readonly date: string;
  readonly blockHeight: number | null;
  readonly nested: boolean;
  readonly onTokenAccount: boolean;
}

export interface OperationsStatus {
  readonly pending: boolean;
  readonly sourceId?: string;
  readonly error?: string;
}

export interface AccountOperationsRow {
  readonly accountId: string;
  readonly name: string;
  readonly currencyId: string;
  readonly address: string;
  readonly granular: boolean;
  readonly operations: readonly ListedOperation[];
  readonly total: number | undefined;
  readonly hasMore: boolean;
  readonly complete: boolean;
  readonly status: OperationsStatus;
}

export interface AccountOperationsToolProps {
  readonly accounts: readonly AccountOperationsRow[];
  readonly onRefresh: (accountId: string) => void;
  readonly onLoadMore: (accountId: string) => void;
  readonly ready: boolean;
}
