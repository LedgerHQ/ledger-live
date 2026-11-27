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
  readonly selected?: boolean;
  /** The app holds the account already: it cannot be selected. */
  readonly added?: boolean;
  /** Its family needs a device step before it can be added. */
  readonly needsCompletion?: boolean;
  /** Where that step stands; the completed key is never shown, it can hold a secret. */
  readonly completion?: CompletionStatus;
  /** Why a failed completion failed, e.g. another device or seed than the scan's; never a key. */
  readonly completionError?: string;
}

export interface ScanCurrency {
  readonly id: CryptoCurrencyId;
  readonly name: string;
}

export interface ScanCounters {
  readonly derivations: number;
  readonly statusReads: number;
}

export type CompletionStatus = "waiting" | "awaiting-approval" | "completed" | "refused" | "failed";

export type CompletionRunStatus = "idle" | "completing" | "done" | "stopped" | "error";

export interface SelectionSummary {
  /** Selected accounts the completion step would prompt. */
  readonly completable: number;
  /** Selected accounts ready to add: no step needed, or completed. */
  readonly addable: number;
}

export type ScanStatus = "idle" | "scanning" | "done" | "stopped" | "error";

export interface AccountDiscoveryState {
  readonly status: ScanStatus;
  readonly currencyId?: CryptoCurrencyId;
  readonly rows: readonly DiscoveredRow[];
  readonly counters: ScanCounters;
  readonly elapsedMs?: number;
  readonly error?: string;
  readonly selection: SelectionSummary;
  readonly completion: { readonly status: CompletionRunStatus; readonly error?: string };
  readonly notice?: string;
  readonly adding?: boolean;
}

export interface AccountDiscoveryToolProps {
  readonly currencies: readonly ScanCurrency[];
  readonly state: AccountDiscoveryState;
  readonly onScan: (currencyId: CryptoCurrencyId) => void;
  readonly onToggle: (key: string) => void;
  /** Runs the completion step on the selected accounts that need it. */
  readonly onComplete: () => void;
  readonly onAdd: () => void;
}
