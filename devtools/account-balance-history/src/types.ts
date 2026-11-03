export interface AccountBalanceHistoryToolSeries {
  readonly assetId: string;
  readonly pointCount: number;
  readonly firstDate?: string;
  readonly lastDate?: string;
  /** Formatted in the asset's unit when known, else the raw amount. */
  readonly firstBalance?: string;
  readonly lastBalance?: string;
  /** What the first and last balances were worth in the app's fiat, formatted, when read with it. */
  readonly firstCountervalue?: string;
  readonly lastCountervalue?: string;
  /** Oldest first, in any unit: only their shape is drawn. */
  readonly values: readonly number[];
}

export interface AccountBalanceHistoryToolAccount {
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the UUID. */
  readonly descriptor?: string;
  /** Of the last read, whatever its range. */
  readonly reading: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  readonly readAt?: number;
  /** Of the selected range; absent until a read of it answered. */
  readonly series?: readonly AccountBalanceHistoryToolSeries[];
}

export interface AccountBalanceHistoryToolProps {
  readonly ranges: readonly string[];
  readonly range: string;
  readonly onRangeChange: (range: string) => void;
  /** The app's countervalue setting, e.g. `USD`: the only fiat its rates are loaded for. */
  readonly fiat: string;
  /** Reads, and shows, the histories valued in `fiat`. */
  readonly countervalue: boolean;
  readonly onCountervalueChange: (countervalue: boolean) => void;
  readonly accounts: readonly AccountBalanceHistoryToolAccount[];
  /** Reads the account's history for the selected range again, whatever its age. */
  readonly onRead: (accountUUID: string) => void;
  readonly onReadAll: () => void;
}
