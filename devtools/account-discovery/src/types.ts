import type { AccountGate } from "@domain/entity-account-status";
import type { CryptoCurrencyId } from "@domain/entity-currency-crypto";
import type { DerivationMode } from "@domain/entity-derivation";

export interface DiscoveredRow {
  readonly key: string;
  readonly derivationMode: DerivationMode;
  readonly index: number;
  /** `false` for the first empty account of a mode, offered for creation. */
  readonly used: boolean;
  /** What the account must do first, e.g. `onboarding`; absent when nothing. */
  readonly gate?: AccountGate["type"];
  /** The descriptor in its text form: `account:2:<type>:<name>:<env>:<key>:<path>`. */
  readonly descriptor: string;
  /** Milliseconds from the start of the scan to the moment the account was found. */
  readonly foundAtMs: number;
}

export interface ScanCurrency {
  readonly id: CryptoCurrencyId;
  readonly name: string;
}

export interface ScanCounters {
  readonly derivations: number;
  readonly statusReads: number;
}

export type ScanStatus = "idle" | "scanning" | "done" | "stopped" | "error";

export interface AccountDiscoveryState {
  readonly status: ScanStatus;
  readonly currencyId?: CryptoCurrencyId;
  readonly rows: readonly DiscoveredRow[];
  readonly counters: ScanCounters;
  readonly elapsedMs?: number;
  readonly error?: string;
}

export interface AccountDiscoveryToolProps {
  readonly currencies: readonly ScanCurrency[];
  readonly state: AccountDiscoveryState;
  readonly onScan: (currencyId: CryptoCurrencyId) => void;
}
