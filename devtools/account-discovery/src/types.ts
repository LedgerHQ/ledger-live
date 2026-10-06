export interface DiscoveredRow {
  readonly key: string;
  readonly derivationMode: string;
  readonly index: number;
  /** `false` for the first empty account of a mode, offered for creation. */
  readonly used: boolean;
  /** The xpub of a UTXO account, the address otherwise. */
  readonly address: string;
  readonly path: string;
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
  readonly onScan: (currencyId: string, options: { lookahead: number }) => void;
  readonly onStop: () => void;
  /** Why a scan cannot start (no device selected), or `undefined` when it can. */
  readonly blockedReason?: string;
}
