import type { BigNumber } from "bignumber.js";
import type { BitcoinAccount, BitcoinAccountRaw, BitcoinOutput, Transaction } from "../../types";

export type ZcashSyncState = "disabled" | "ready" | "running" | "stopped" | "complete" | "outdated";

/** Orchard spending fields shared across note types. */
type SpendingFields = {
  nullifier?: string; // 64-char hex (32 bytes)
  rho?: string; // 64-char hex (32 bytes)
  rseed?: string; // 64-char hex (32 bytes)
  cmx?: string; // 64-char hex (32 bytes)
  position?: string; // decimal string (avoids f64 precision loss)
  recipient?: string; // 86-char hex (43 bytes)
};

export type DecryptedOutputRaw = SpendingFields & {
  memo: string;
  transfer_type: string;
  amount: string; // zatoshis
  is_spent?: boolean;
};

export type DecryptedOutput = SpendingFields & {
  memo: string;
  transfer_type: string;
  amount: BigNumber; // zatoshis
  isSpent?: boolean;
};

/** An unspent Orchard note eligible for spending (all spending fields required). */
export type SpendableNote = Required<SpendingFields> & {
  txid: string;
  outputIndex: number;
  amount: BigNumber;
};

export type DecryptedTransaction = {
  orchard_outputs: DecryptedOutput[];
  sapling_outputs: DecryptedOutput[];
  ironwood_outputs?: DecryptedOutput[];
};

export type ShieldedTransaction = {
  id: string;
  hex: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  fee: BigNumber; // zatoshis
  /**
   * Sum of the transparent outputs, in zatoshis. Carries the value of a
   * shielded→transparent send, which leaves no decrypted note behind to account
   * for it. Absent for transactions scanned before the scanner reported it.
   */
  transparentOut?: BigNumber;
  /**
   * Whether the transaction spends transparent inputs, in which case those
   * inputs — rather than the shielded pools — may be paying `transparentOut`.
   */
  hasTransparentInputs?: boolean;
  decryptedData?: DecryptedTransaction;
};

export type ZcashPrivateInfo = {
  saplingBalance: BigNumber;
  orchardBalance: BigNumber;
  ironwoodBalance: BigNumber;
  syncState: ZcashSyncState;
  progress: number;
  estimatedTimeRemaining: SyncEstimatedTime;
  ufvk: string | null;
  birthday: string | null;
  shieldedAddress: string | null;
  lastSyncTimestamp: number | null;
  lastProcessedBlock: number | null;
  transactions: ShieldedTransaction[];
  // This chain-adapter (the zcashShielded flag-off path) never runs the
  // automatic shielded-sync retry that sets this -- kept only for structural
  // parity with coin-zcash's ZcashPrivateInfo, which shared LWD UI also reads.
  lastSyncError?: string | null;
};

export type ZcashPrivateInfoRaw = {
  orchardBalance: string;
  saplingBalance: string;
  ironwoodBalance: string;
  syncState: string;
  progress: number;
  estimatedTimeRemaining: SyncEstimatedTime;
  ufvk: string | null;
  birthday: string | null;
  shieldedAddress: string | null;
  lastSyncTimestamp: number | null;
  lastProcessedBlock: number | null;
  transactions: ShieldedTransactionRaw[];
  lastSyncError?: string | null;
};

export type ShieldedTransactionRaw = {
  id: string;
  hex: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
  fee: string; // zatoshis
  /** Absent on accounts persisted before the scanner reported the transparent bundle. */
  transparentOut?: string; // zatoshis
  hasTransparentInputs?: boolean;
  decryptedData?: {
    orchard_outputs: DecryptedOutputRaw[];
    sapling_outputs: DecryptedOutputRaw[];
    ironwood_outputs?: DecryptedOutputRaw[];
  };
};

export type SyncEstimatedTime = {
  hours: number;
  minutes: number;
};

export type ZcashAccount = BitcoinAccount & {
  privateInfo?: ZcashPrivateInfo;
};

export type ZcashAccountRaw = BitcoinAccountRaw & {
  privateInfo?: ZcashPrivateInfoRaw;
};

// ── Transaction types ───────────────────────────────────────────────────

export type ZcashTransferType =
  | "transparent"
  | "transparent-to-shielded"
  | "shielded-to-transparent"
  | "shielded"
  | "ironwood"
  | "ironwood-to-transparent";

export type ZcashTransaction = Transaction & {
  transferType: ZcashTransferType;
  /** Source balance pool selected on the Recipient step. */
  sender?: "public" | "private";
  /** Recipient privacy class derived from the address. */
  recipientType?: "public" | "private";
  /** Optional 512-byte memo field for shielded outputs. */
  memo?: string;
  // Coin selection results (populated by prepareTransaction)
  selectedNotes?: SpendableNote[];
  zcashFee?: BigNumber; // ZIP-317 computed fee
  changeAmount?: BigNumber; // Change returning to self
  /**
   * Optional transparent UTXO override for Public→* flows, provided by callers.
   * When set, it takes precedence over `account.bitcoinResources.utxos` during
   * transparent-input mapping. Not populated by prepareTransaction.
   */
  selectedUtxos?: BitcoinOutput[];
};
