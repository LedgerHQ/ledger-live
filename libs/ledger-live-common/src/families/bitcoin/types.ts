// Ledger Wallet types of the bitcoin family (ADR-065 D16). coin-bitcoin only declares its
// CoinModuleApi types; the account and transaction model live here.
import { BigNumber as BigNumberClass, type BigNumber } from "bignumber.js";
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
} from "@ledgerhq/wallet-btc/account";
import type { Versioned } from "@ledgerhq/account-module-framework";
import type { UtxoAccountState } from "@ledgerhq/account-module-utxo";
import type { JsonSafeRecord } from "../../bridge/generic-coin-framework/types";

// Zcash accounts are served by coin-zcash; its account types stay reachable here for the apps
export type { ZcashAccount, ZcashAccountRaw } from "@ledgerhq/coin-zcash/types/bridge";

export const bitcoinPickingStrategy = {
  DEEP_OUTPUTS_FIRST: 0,
  OPTIMIZE_SIZE: 1,
  MERGE_OUTPUTS: 2,
  CUSTOM: 3,
} as const;
export type BitcoinPickingStrategy =
  (typeof bitcoinPickingStrategy)[keyof typeof bitcoinPickingStrategy];

export type UtxoStrategy = {
  strategy: BitcoinPickingStrategy;
  excludeUTXOs: Array<{
    hash: string;
    outputIndex: number;
  }>;
};

/**
 * What the user chooses for a bitcoin transaction. Carried in `familySpecificData` (ADR-047), so it
 * is JSON-safe: amounts and rates are decimal strings.
 */
export type BitcoinFamilySpecificData = {
  /** Coin selection (picking strategy and coin control exclusions). */
  utxoStrategy?: UtxoStrategy;
  /** Custom fee rate, sat/vB, as a decimal string; set with the "custom" fees strategy. */
  feePerByte?: string;
  /** OP_RETURN payload, hex encoded. */
  opReturnData?: string;
  /** Replace-by-fee: the pending transaction this one replaces (speed up / cancel). */
  replaceTxId?: string;
  /** Change address requested by a live app; it must be the account's next change address. */
  changeAddress?: string;
  /** Whether the transaction signals BIP125 replaceability; set on the signed transaction. */
  rbf?: boolean;
};

/**
 * What the coin module computed for the last estimation (ADR-050), in `feeParameters`: JSON-safe,
 * the bigints of `BitcoinFeeParameters` as decimal strings.
 */
export type BitcoinFeeParametersJson = {
  feePerByte?: string;
  feeRates?: { slow: string; medium: string; fast: string };
  relayFeePerByte?: string;
  inputs?: Array<{ txid: string; vout: number; value: string; address: string }>;
  outputs?: Array<{ address: string | null; value: string; isChange: boolean }>;
  amount?: string;
  minReplacementFee?: string;
  originalFeePerByte?: string;
  originalFee?: string;
  minReplacementFeePerByte?: string;
  replacedInputs?: Array<{ txid: string; vout: number; value: string; address: string | null }>;
  replacedOutputs?: Array<{ address: string | null; value: string }>;
};

export type Transaction = TransactionCommon & {
  family: "bitcoin";
  mode?: "send";
  fees?: BigNumber | null;
  nonce?: BigNumber | null;
  customFees?: { parameters: { fees?: BigNumber | null } };
  familySpecificData?: BitcoinFamilySpecificData;
  /** @see BitcoinFeeParametersJson — derived, never persisted. */
  feeParameters?: JsonSafeRecord;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "bitcoin";
  mode?: "send";
  fees?: string | null;
  nonce?: string | null;
  customFees?: { parameters: { fees?: string | null } };
  familySpecificData?: BitcoinFamilySpecificData;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

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
  /** Spendable outputs, mempool included — what coin control shows. */
  utxos: BitcoinOutput[];
  /** State of the UTXO account module (generic bridge). */
  accountState?: Versioned<UtxoAccountState> | undefined;
  /** wallet-btc storage of the Zcash legacy bridge; migrated away from everywhere else. */
  walletAccount?: WalletAccount | undefined;
};

export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[];
  accountState?: Versioned<UtxoAccountState> | undefined;
  walletAccount?: WalletAccountRaw | undefined;
};

export const initialBitcoinResourcesValue: BitcoinResources = {
  utxos: [],
};

export type BitcoinAccount = Account & { bitcoinResources: BitcoinResources };

export type BitcoinAccountRaw = AccountRaw & {
  bitcoinResources: BitcoinResourcesRaw;
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

export type BtcOperation = Operation<BtcOperationExtra>;

// Possible types of "replace by fee" (aka "edit transaction") operations:
export type EditType = "cancel" | "speedup";

export const getFamilySpecificData = (
  transaction: Pick<Transaction, "familySpecificData">,
): BitcoinFamilySpecificData => transaction.familySpecificData ?? {};

export const getFeeParameters = (
  transaction: Pick<Transaction, "feeParameters">,
): BitcoinFeeParametersJson => (transaction.feeParameters ?? {}) as BitcoinFeeParametersJson;

/** The fee rate of a transaction: the last estimation's, else the custom one; `null` when unknown. */
export function getFeePerByte(
  transaction: Pick<Transaction, "familySpecificData" | "feeParameters">,
): BigNumber | null {
  const rate =
    getFeeParameters(transaction).feePerByte ?? getFamilySpecificData(transaction).feePerByte;
  if (rate === undefined || rate === null || rate === "") return null;
  const value = new BigNumberClass(rate);
  return value.isNaN() ? null : value;
}

export const defaultUtxoStrategy = (): UtxoStrategy => ({
  strategy: bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST,
  excludeUTXOs: [],
});

export const getUtxoStrategy = (
  transaction: Pick<Transaction, "familySpecificData">,
): UtxoStrategy => getFamilySpecificData(transaction).utxoStrategy ?? defaultUtxoStrategy();
