/** A call the router made on a source during the run. */
export interface AggregationSourceCall {
  readonly batch: boolean;
  readonly accounts: number;
  readonly failed: number;
  readonly elapsedMs: number;
}

/** What one source answered during the run. */
export interface AggregationSourceSummary {
  readonly sourceId: string;
  readonly ok: number;
  readonly failed: number;
  readonly calls: readonly AggregationSourceCall[];
}

export interface AggregationTotal {
  readonly assetId: string;
  /** Formatted in the asset's unit when known, else the raw amount. */
  readonly balance: string;
  /** In the app's countervalue, when a rate is known. */
  readonly fiat?: string;
  readonly accounts: number;
}

export interface AggregationAccount {
  readonly accountUUID: string;
  readonly label: string;
  readonly sourceId?: string;
  readonly error?: string;
  readonly assets: number;
}

/** One "Fetch total balance": every account read in one tick, answered as one payload. */
export interface AggregationRun {
  readonly id: number;
  readonly startedAt: number;
  /** Absent while the run is going. */
  readonly durationMs?: number;
  /** Every account read again, whatever the age of its balance. */
  readonly force: boolean;
  readonly accounts: number;
  readonly sources: readonly AggregationSourceSummary[];
  /** Accounts no source answered: the reason is on the account. */
  readonly unanswered: number;
  /** The sum of every asset's countervalue, formatted in the app's countervalue. */
  readonly fiatTotal: string;
  /** Assets left out of `fiatTotal`: no currency or no rate known. */
  readonly unvalued: number;
  /** Largest countervalue first. */
  readonly totals: readonly AggregationTotal[];
  readonly perAccount: readonly AggregationAccount[];
  /** The aggregate as a screen would receive it, as JSON. */
  readonly payload: string;
}

export interface AccountAggregationToolProps {
  readonly accountCount: number;
  /** A run is going: another one would count its calls. */
  readonly running: boolean;
  /** Latest first. */
  readonly runs: readonly AggregationRun[];
  readonly onFetchTotalBalance: (options: { force: boolean }) => void;
  readonly onClear: () => void;
}
