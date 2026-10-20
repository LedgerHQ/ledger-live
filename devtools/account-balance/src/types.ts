export interface AccountBalanceToolRow {
  readonly assetId: string;
  readonly balance: string;
  readonly spendableBalance: string;
}

export interface AccountBalanceToolAccount {
  readonly accountUUID: string;
  readonly network: string;
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
