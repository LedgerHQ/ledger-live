import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import type { TxData } from "@ledgerhq/coin-module-framework/api/types";

export type BitcoinCoinConfig = CurrencyConfig & {
  /** Ledger explorer id, e.g. "btc". Defaults to the currency id. */
  explorerId?: string;
};

export type BitcoinContext = Context<BitcoinCoinConfig>;

/** What the consumer injects when creating the API (dependency inversion, as for wallet-btc). */
export type BitcoinApiOptions = {
  /** Ledger explorer endpoint, e.g. https://explorers.api.live.ledger.com */
  explorerEndpoint: string;
  /** Overrides the explorer id of the currency config (e.g. "btc_regtest"). */
  explorerId?: string;
};

/** wallet-btc derivation modes (`DerivationModes` values). */
export type BitcoinDerivationMode = "Legacy" | "SegWit" | "Native SegWit" | "Taproot";

/** One input of the transaction, chosen by the caller (the account layer). */
export type BitcoinIntentInput = {
  txid: string;
  vout: number;
  address: string;
  /** BIP32 path of the key controlling `address`, e.g. "84'/0'/0'/1/3". */
  path: string;
  /** Satoshis, as a decimal string. Read from the previous transaction when absent. */
  value?: string;
  /** Height of the block holding the previous transaction, `null` while it is pending. */
  blockHeight?: number | null;
};

/**
 * The bitcoin `TxData` of a `TransactionIntent`.
 *
 * `CoinModuleApi` is address-based: a UTXO transaction spends the coins of a whole account, so
 * the account-wide facts it needs travel here, decided by the caller: the inputs (coin selection),
 * the change destination and the signing paths. The module never reads account state.
 */
export interface BitcoinTxData extends TxData {
  type: "bitcoin";
  /** Derivation mode of the account. Drives sizes, the change script and the signing flags. */
  derivationMode?: BitcoinDerivationMode;
  /** The inputs to spend. Absent: the module only prices a nominal one-input transaction. */
  inputs?: BitcoinIntentInput[];
  /** Where the change goes, when the transaction has some. */
  change?: { address: string; path: string };
  /** Custom fee rate in sat/vB, as a decimal string. Overrides the fee strategy. */
  feePerByte?: string;
  /** Opts in to BIP125 replaceability (nSequence 0). */
  rbf?: boolean;
  /** OP_RETURN payload, hex encoded. */
  opReturnData?: string;
  /** Replace-by-fee: the transaction replaced, and the other pending ones it conflicts with. */
  replacement?: { txid: string; conflictingTxIds?: string[] };
}

/** Intent types of a replacement (speed up / cancel), on top of the default "send". */
export const REPLACE_SPEEDUP = "replace-speedup";
export const REPLACE_CANCEL = "replace-cancel";

export const BITCOIN_OPERATION_DETAILS_VERSION = 1;

export type BitcoinTxDetailsInput = {
  /** Previous transaction id. Absent for a coinbase input. */
  txid?: string;
  vout: number;
  address?: string;
  /** Satoshis, decimal string. */
  value: string;
  sequence: number;
};

export type BitcoinTxDetailsOutput = {
  index: number;
  address?: string;
  /** Satoshis, decimal string. */
  value: string;
};

/** The whole transaction, as seen from any of the addresses it touches. */
export type BitcoinTxDetails = {
  id: string;
  receivedAt: string;
  block: { height: number; hash: string; time: string } | null;
  /** Satoshis, decimal string. */
  fees: string;
  inputs: BitcoinTxDetailsInput[];
  outputs: BitcoinTxDetailsOutput[];
};

/**
 * `Operation.details` of `listOperations`. The operation itself is the impact of the transaction
 * on the queried address; `tx` carries the full transaction so that a caller holding a set of
 * addresses can interpret it once against all of them (change, self-sends).
 */
export type BitcoinOperationDetails = {
  version: typeof BITCOIN_OPERATION_DETAILS_VERSION;
  /** The transaction is in the mempool (`tx.block` is null). */
  pending: boolean;
  tx: BitcoinTxDetails;
};

export const BITCOIN_SIGNING_ENVELOPE_VERSION = 1;

/**
 * The "unsigned transaction" `craftTransaction` returns. The Ledger bitcoin app does not sign a
 * serialized transaction: it is handed every previous transaction, one path per input and the
 * change path, and it returns the signed transaction. This envelope carries exactly that request.
 */
export type BitcoinSigningEnvelope = {
  version: typeof BITCOIN_SIGNING_ENVELOPE_VERSION;
  currency: string;
  inputs: Array<{
    /** Previous transaction, hex. */
    prevTxHex: string;
    txid: string;
    outputIndex: number;
    sequence: number;
    path: string;
    blockHeight: number | null;
  }>;
  outputs: Array<{ script: string; value: string; address: string | null; isChange: boolean }>;
  /** Outputs serialized as the device expects them, hex. */
  outputScriptHex: string;
  changePath?: string;
  lockTime?: number;
  sigHashType: number;
  segwit: boolean;
  additionals: string[];
  /** Hex encoded. */
  expiryHeight?: string;
  hasExtraData: boolean;
  /** Current tip height. */
  blockHeight: number;
};

/** `FeeEstimation.parameters` of `estimateFees`. */
export type BitcoinFeeParameters = {
  /** Fee rate the estimation used, sat/vB. */
  feePerByte: bigint;
  /** Network presets, sat/vB. */
  feeRates: { slow: bigint; medium: bigint; fast: bigint };
  /** Minimum relay fee rate, sat/vB. */
  relayFeePerByte: bigint;
  /** Inputs the estimation priced. */
  inputs: Array<{ txid: string; vout: number; value: bigint; address: string }>;
  /** Outputs of the priced transaction, change included. */
  outputs: Array<{ address: string | null; value: bigint; isChange: boolean }>;
  /** Send-max: the amount left once the fee is paid. */
  amount?: bigint;
  /** Replacement: the minimum total fee that replaces every conflicting transaction. */
  minReplacementFee?: bigint;
  /** Replacement: the replaced transaction fee rate, sat/vB. */
  originalFeePerByte?: bigint;
  /** Replacement: the replaced transaction fee. */
  originalFee?: bigint;
  /** Replacement: the lowest rate replacing it, sat/vB — where a speed up starts. */
  minReplacementFeePerByte?: bigint;
  /** Replacement: what the replaced transaction spends, which the replacement spends again. */
  replacedInputs?: Array<{ txid: string; vout: number; value: bigint; address: string | null }>;
  /** Replacement: what the replaced transaction pays. */
  replacedOutputs?: Array<{ address: string | null; value: bigint }>;
};
