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
  /** Each fiat value the row carries, formatted, e.g. `$12.34`. */
  readonly countervalues?: readonly string[];
}

/** The options of a read, each one optional: unset reads the default window. */
export interface AccountOperationToolQuery {
  /** Values the rows in the app's fiat, the one its rates are loaded for. */
  readonly countervalue?: boolean;
  readonly limit?: number;
  /** An asset id of the account, e.g. `ethereum/erc20/usd__coin`. */
  readonly filterAsset?: string;
}

/** The loaded window of one query of an account. */
export interface AccountOperationToolWindow {
  /** As `accountDataQueryKey` writes it: `""` for no query. */
  readonly queryKey: string;
  /** The query's options for humans, e.g. `limit 50`. */
  readonly label: string;
  readonly reading: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  readonly readAt?: number;
  /** Whether the source handed out a cursor for a next page. */
  readonly hasMore: boolean;
  /** Absent until a first read answered. */
  readonly rows?: readonly AccountOperationToolRow[];
}

export interface AccountOperationToolAccount {
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the UUID. */
  readonly descriptor?: string;
  /** The no-query window first, then every other query read for the account. */
  readonly windows: readonly AccountOperationToolWindow[];
}

export interface AccountOperationToolProps {
  readonly accounts: readonly AccountOperationToolAccount[];
  /** Reads the head of the account's `queryKey` window again, whatever its age. */
  readonly onRead: (accountUUID: string, queryKey: string) => void;
  readonly onReadMore: (accountUUID: string, queryKey: string) => void;
  /** Reads every account with these options, into their window. */
  readonly onReadAll: (query: AccountOperationToolQuery) => void;
  /** The asset ids the accounts hold, suggested for the filter. */
  readonly assetIds: readonly string[];
  /** The app's countervalue setting, e.g. `USD`: the only fiat its rates are loaded for. */
  readonly fiat: string;
}
