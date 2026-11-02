export interface AccountBalanceToolRow {
  readonly assetId: string;
  /** Formatted in the asset's unit when known, else the raw amount. */
  readonly balance: string;
  /** Only when it differs from `balance`. */
  readonly spendableBalance?: string;
  readonly empty: boolean;
}

export interface AccountBalanceToolAccount {
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the UUID. */
  readonly descriptor?: string;
  readonly reading: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  readonly readAt?: number;
  /** Absent until a first read answered. */
  readonly rows?: readonly AccountBalanceToolRow[];
}

export interface AccountBalanceToolProps {
  readonly accounts: readonly AccountBalanceToolAccount[];
  /** Reads the account's balance again, whatever its age. */
  readonly onRead: (accountUUID: string) => void;
  readonly onReadAll: () => void;
}
