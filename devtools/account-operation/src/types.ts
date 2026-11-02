export interface AccountOperationToolRow {
  readonly id: string;
  readonly hash: string;
  readonly type: string;
  readonly assetId: string;
  /** Formatted in the asset's unit when known, else the raw amount. */
  readonly value: string;
  readonly fee: string;
  readonly date: string;
  readonly pending: boolean;
  readonly failed: boolean;
  /** A token, sub or internal operation, shown under its parent. */
  readonly child: boolean;
}

export interface AccountOperationToolAccount {
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the UUID. */
  readonly descriptor?: string;
  readonly reading: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  readonly readAt?: number;
  /** Whether the source handed out a cursor for a next page. */
  readonly hasMore: boolean;
  /** Absent until a first read answered. */
  readonly rows?: readonly AccountOperationToolRow[];
}

export interface AccountOperationToolProps {
  readonly accounts: readonly AccountOperationToolAccount[];
  /** Reads the account's head again, whatever its age. */
  readonly onRead: (accountUUID: string) => void;
  readonly onReadMore: (accountUUID: string) => void;
  readonly onReadAll: () => void;
}
