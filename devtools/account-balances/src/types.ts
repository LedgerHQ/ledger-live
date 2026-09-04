/** Enough of a currency unit to render an amount the way the app would. */
export interface AmountUnit {
  readonly code: string;
  readonly magnitude: number;
}

/** A balance the account-data layer has stored for one account or token account. */
export interface StoredBalance {
  readonly assetId: string;
  /** Absent when the host could not resolve the asset — the raw smallest-unit value is shown then. */
  readonly unit?: AmountUnit;
  /** Total holdings, in the asset's smallest unit. */
  readonly value: string;
  /** The part of `value` that can be spent right now. */
  readonly spendable: string;
  /** When the value was observed, ISO 8601. */
  readonly at: string;
}

/** Freshness and outcome of the `balance` slice for one account. */
export interface BalanceStatus {
  readonly pending: boolean;
  /** Which source last answered — `coin-module-api` (one chain call) or `legacy-bridge` (full sync). */
  readonly sourceId?: string;
  readonly error?: string;
  /** Epoch ms of the last read by the scheduler; absent when only a background sync has produced it. */
  readonly lastFetchedAt?: number;
}

export interface AccountBalanceRow {
  readonly accountId: string;
  /** How the account is named in the app. */
  readonly name: string;
  readonly currencyId: string;
  /** The address or xpub the balance is read from. */
  readonly address: string;
  /** Whether a coin module declares it can serve this account's balance on its own. */
  readonly granular: boolean;
  /** Absent until something has read it. */
  readonly balance?: StoredBalance;
  /** Token-account balances, which arrive with the parent's read. */
  readonly tokens: readonly StoredBalance[];
  readonly status: BalanceStatus;
}

export interface AccountBalancesToolProps {
  readonly accounts: readonly AccountBalanceRow[];
  /** Read one account's balance through the layer, ignoring freshness. */
  readonly onRead: (accountId: string) => void;
  /** Read every listed account's balance, respecting freshness — what a portfolio mount does. */
  readonly onReadAll: () => void;
  /**
   * Whether the host wired a scheduler. `false` means the layer is not running, so reads do nothing
   * and only what a background sync mirrored is visible.
   */
  readonly ready: boolean;
}
