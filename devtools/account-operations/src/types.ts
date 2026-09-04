/** Enough of a currency unit to render an amount the way the app would. */
export interface AmountUnit {
  readonly code: string;
  readonly magnitude: number;
}

/** One operation, as the tool renders it. */
export interface ListedOperation {
  readonly id: string;
  /** `IN`, `OUT`, `FEES`, a staking type… — whatever the family reported. */
  readonly type: string;
  /** Absolute amount moved, in the asset's smallest unit. */
  readonly value: string;
  readonly assetId: string;
  /** Absent when the host could not resolve the asset — the raw value is shown then. */
  readonly unit?: AmountUnit;
  /** ISO 8601. */
  readonly date: string;
  /** `null` while the operation is still pending. */
  readonly blockHeight: number | null;
  /** Set when this row came out of another operation — a token transfer, an internal call. */
  readonly nested: boolean;
  /** Whether the row landed on a token account rather than the main one. */
  readonly onTokenAccount: boolean;
}

/** Outcome of the last read for one account. */
export interface OperationsStatus {
  readonly pending: boolean;
  /** Which source answered — `granular` (one page) or `full-sync` (the whole history). */
  readonly sourceId?: string;
  readonly error?: string;
}

export interface AccountOperationsRow {
  readonly accountId: string;
  /** How the account is named in the app. */
  readonly name: string;
  readonly currencyId: string;
  /** The address or xpub the history is read from. */
  readonly address: string;
  /** Whether a coin module is allowed to serve this account's history on its own. */
  readonly granular: boolean;
  /** The loaded window, newest first. */
  readonly operations: readonly ListedOperation[];
  /**
   * How many operations the account has — **`undefined` when that is not knowable**.
   *
   * The single most important thing this tool shows. A paginated read cannot know the total, so a
   * label that reads "N transactions" is a lie until the history is complete. Rendering the
   * difference is the point.
   */
  readonly total: number | undefined;
  /** Whether asking for more would return anything. */
  readonly hasMore: boolean;
  /** Whether the loaded window is the entire history. */
  readonly complete: boolean;
  readonly status: OperationsStatus;
}

export interface AccountOperationsToolProps {
  readonly accounts: readonly AccountOperationsRow[];
  /** Re-read the head of one account's history, ignoring freshness. */
  readonly onRefresh: (accountId: string) => void;
  /**
   * Read the next page.
   *
   * Does nothing on a source that cannot resume from a cursor — which is the asymmetry worth
   * watching, and why the button is disabled rather than hidden when `hasMore` is false.
   */
  readonly onLoadMore: (accountId: string) => void;
  /**
   * Whether the host registered any history source. `false` means a read can only report that
   * nothing can serve the account.
   */
  readonly ready: boolean;
}
