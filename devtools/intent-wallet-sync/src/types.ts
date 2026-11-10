import type { TrustchainMemberId } from "@features/platform-intent-wallet-sync";

/** The Ledger Sync operation a log row belongs to. */
export type WalletSyncIntentToolOperation = "add-member" | "remove-member";

/** One job state the host logged. */
export interface WalletSyncIntentToolLogRow {
  /** Milliseconds since epoch. */
  readonly at: number;
  readonly operation: WalletSyncIntentToolOperation;
  /** The job state's `type`. */
  readonly jobState: string;
  /** Failure reason, result type or rootId. Never keys or credentials. */
  readonly detail: string | null;
}

/** A trustchain member the tool can remove, never this instance. */
export interface WalletSyncIntentToolMember {
  readonly id: TrustchainMemberId;
  readonly name: string;
}

/**
 * The host does the device work: it mounts its own Device Intent Executor for
 * each operation and reports every job state in `log`. The tool only renders.
 */
export interface WalletSyncIntentToolProps {
  readonly status: "idle" | "running";
  readonly hasMemberCredentials: boolean;
  readonly hasTrustchain: boolean;
  /** Null until the host fetched the members of the current trustchain. */
  readonly members: readonly WalletSyncIntentToolMember[] | null;
  readonly log: readonly WalletSyncIntentToolLogRow[];
  readonly onAddMember: () => void;
  readonly onRemoveMember: (memberId: TrustchainMemberId) => void;
  readonly onRefreshMembers: () => void;
  readonly onClearLog: () => void;
}

/** The registry derives this name from the tool id. */
export type IntentWalletSyncToolProps = WalletSyncIntentToolProps;
