import type { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type {
  Account as WalletAccount,
  SerializedAccount as WalletAccountRaw,
} from "@ledgerhq/wallet-btc/index";
import type { SpendableNote, ZcashPrivateInfo, ZcashPrivateInfoRaw } from "../network/types";

// ── Transparent (UTXO) account resources ───────────────────────────────────
//
// Option D: coin-zcash owns its own transparent-account resource shapes
// instead of importing them from @ledgerhq/coin-bitcoin. Structurally
// identical to coin-bitcoin's BitcoinOutput/BitcoinResources -- both wrap the
// same @ledgerhq/wallet-btc primitives -- so the persisted AccountRaw
// (produced today by coin-bitcoin's assignToAccountRaw) round-trips through
// coin-zcash's assignFromAccountRaw (see bridge/serialization.ts).

export type BitcoinOutput = {
  hash: string;
  outputIndex: number;
  blockHeight: number | null | undefined;
  address: string | null | undefined;
  value: BigNumber;
  rbf: boolean;
  isChange: boolean;
};

export type BitcoinOutputRaw = [
  string,
  number,
  number | null | undefined,
  string | null | undefined,
  string,
  number, // rbf 0/1 for compression
  number,
];

export type BitcoinResources = {
  utxos: BitcoinOutput[];
  walletAccount?: WalletAccount | undefined;
};

export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[];
  walletAccount?: WalletAccountRaw | undefined;
};

export const initialBitcoinResourcesValue = {
  utxos: [],
};

export type BtcInputRef = {
  hash: string;
  outputIndex: number;
  address: string;
};

export type BtcOperationExtra = {
  /** Input outpoints in "txid-index" format. Used by RBF/conflict-dedup logic. */
  inputs?: string[];
  /** Structured input references with address metadata. Parallel to `inputs`. */
  inputRefs?: BtcInputRef[];
};

export type ZcashOperationExtra = BtcOperationExtra & { zcashShielded?: boolean };

export type BtcOperation = Operation<BtcOperationExtra>;

export type BitcoinAccount = Account & { bitcoinResources: BitcoinResources };
export type BitcoinAccountRaw = AccountRaw & { bitcoinResources: BitcoinResourcesRaw };

export type ZcashAccount = BitcoinAccount & {
  privateInfo?: ZcashPrivateInfo;
};

export type ZcashAccountRaw = BitcoinAccountRaw & {
  privateInfo?: ZcashPrivateInfoRaw;
};

export function isZcashAccount(a: BitcoinAccount): a is ZcashAccount {
  return "privateInfo" in a && a.currency.id === "zcash";
}

// ── Transaction types ───────────────────────────────────────────────────

export type ZcashTransferType =
  | "transparent"
  | "transparent-to-shielded"
  | "shielded-to-transparent"
  | "shielded";

export type Transaction = TransactionCommon & {
  family: "zcash";
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

export type TransactionRaw = TransactionCommonRaw & {
  family: "zcash";
  transferType: ZcashTransferType;
  sender?: "public" | "private";
  recipientType?: "public" | "private";
  memo?: string;
  zcashFee?: string;
  changeAmount?: string;
};

export type ZcashTransaction = Transaction;

export function isZcashTransaction(tx: TransactionCommon & { family?: string }): tx is Transaction {
  return "transferType" in tx && (tx as Transaction).transferType !== undefined;
}

export function isShieldedTransfer(tx: Transaction): boolean {
  return tx.transferType !== undefined && tx.transferType !== "transparent";
}

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
