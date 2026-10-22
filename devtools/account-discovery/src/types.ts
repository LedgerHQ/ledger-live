export interface DiscoveredRow {
  readonly key: string;
  readonly derivationMode: string;
  readonly index: number;
  /** `false` for the first empty account of a mode, offered for creation. */
  readonly used: boolean;
  /** The descriptor in its text form: `account:1:<type>:<name>:<env>:<xpub or address>:<path>`. */
  readonly descriptor: string;
  /** Milliseconds from the start of the scan to the moment the account was found. */
  readonly foundAtMs: number;
}

export interface ScanCurrency {
  readonly id: string;
  readonly name: string;
}

export interface ScanCounters {
  readonly derivations: number;
  readonly existenceChecks: number;
}

/** Accounts derived before their existence is asked in one go, and windows in flight at once. */
export interface ScanOptions {
  readonly window: number;
  readonly lookahead: number;
}

export type ScanStatus = "idle" | "scanning" | "done" | "error";

export interface AccountDiscoveryState {
  readonly status: ScanStatus;
  readonly currencyId?: string;
  readonly rows: readonly DiscoveredRow[];
  readonly counters: ScanCounters;
  readonly elapsedMs?: number;
  readonly error?: string;
}

export interface AccountDiscoveryToolProps {
  readonly currencies: readonly ScanCurrency[];
  readonly state: AccountDiscoveryState;
  readonly onScan: (currencyId: string, options: ScanOptions) => void;
  readonly onStop: () => void;
  /** Why a scan cannot start (no device selected), or `undefined` when it can. */
  readonly blockedReason?: string;
}
