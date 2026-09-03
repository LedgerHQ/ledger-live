import type {
  AccountBridge,
  Operation,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import BigNumber from "bignumber.js";

/**
 * Values that are JSON-serializable. Used for the parts of a transaction that are persisted
 * verbatim, so a `BigNumber`, `bigint` or class instance is rejected at the point it is written
 * rather than silently corrupted on revival.
 *
 * `undefined` is permitted so that an optional field typechecks; a round trip drops it, so an absent
 * key and an `undefined` value have to mean the same thing to every consumer.
 */
export type JsonSafe =
  | string
  | number
  | boolean
  | null
  | JsonSafe[]
  | { [key: string]: JsonSafe | undefined };

export type JsonSafeRecord = { [key: string]: JsonSafe | undefined };

type NetworkInfo = {
  fees: BigNumber;
};

type NetworkInfoRaw = {
  fees: string;
};

type Strategy = "slow" | "medium" | "fast";

export type FeeData = {
  maxFeePerGas: BigNumber | null;
  maxPriorityFeePerGas: BigNumber | null;
  gasPrice: BigNumber | null;
  nextBaseFee: BigNumber | null;
};

export type FeeDataRaw = {
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasPrice: string | null;
  nextBaseFee: string | null;
};

export type TransferFee = {
  maxTransferFee: number;
  transferFee: number;
  feePercent: number;
  feeBps: number;
  transferAmountIncludingFee: number;
  transferAmountExcludingFee: number;
};

export type GasOptions = {
  [key in Strategy]: FeeData;
};

export type GasOptionsRaw = {
  [key in Strategy]: FeeDataRaw;
};

export const GENERIC_TRANSACTION_MODE = [
  "send",
  "changeTrust",
  "send-legacy",
  "send-eip1559",
  "delegate",
  "redelegate",
  "stake",
  "undelegate",
  "unstake",
  "finalize_unstake",
  "withdraw",
  "claimReward",
  "compoundReward",
] as const;

export type GenericTransactionMode = (typeof GENERIC_TRANSACTION_MODE)[number];

export type GenericTransaction = TransactionCommon & {
  family: string;
  fees?: BigNumber | null;
  storageLimit?: BigNumber | null;
  customFees?: {
    parameters: { fees?: BigNumber | null };
  };
  tag?: number | null | undefined;
  nonce?: BigNumber | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  data?: Buffer;
  mode?: GenericTransactionMode;
  type?: number | null;
  assetReference?: string;
  assetOwner?: string;
  networkInfo?: NetworkInfo | null;
  chainId?: number | null;
  gasLimit?: BigNumber | null;
  customGasLimit?: BigNumber | null;
  gasPrice?: BigNumber | null;
  maxFeePerGas?: BigNumber | null;
  maxPriorityFeePerGas?: BigNumber | null;
  additionalFees?: BigNumber | null;
  gasOptions?: GasOptions;
  transferFee?: TransferFee;
  /** Rent a chain charges to open an account the transaction creates, in the native unit. */
  stakeAccountRent?: BigNumber;
  /** Account the transaction acts on, when the chain derives it rather than the wallet. */
  ownerTokenAccount?: string;
  sponsored?: boolean;
  valAddress?: string;
  valId?: string;
  withdrawId?: string;
  dstValAddress?: string;
  /**
   * Chain-specific transaction fields with no generic equivalent; the owning family maps them onto
   * the intent's `TxData` via `BridgeApi.buildIntentData` (ADR-047). `JsonSafe` is load-bearing: the
   * bag is written to `GenericTransactionRaw` verbatim, so a non-JSON value corrupts on revival.
   *
   * Only the write half is generic. There is no generic raw-to-transaction converter — each family's
   * own `fromTransactionRaw` enumerates the fields it revives (`families/evm/transaction.ts`) — so a
   * family adopting this bag has to revive it there, or a flow rebuilding from
   * `Operation.transactionRaw` crafts a different intent than the one that was signed.
   *
   * Holds user inputs only. Chain-computed values travel in `feeParameters`, so nothing here has to
   * be merged or invalidated between fee estimations.
   */
  familySpecificData?: JsonSafeRecord;
  /**
   * Fee telemetry the coin module returned in `FeeEstimation.parameters`; per ADR-050 extra fee
   * data travels on the fee-estimation channel, not as bespoke transaction-status fields.
   *
   * Derived, so absent from `GenericTransactionRaw` — reviving it is how a stale figure survives
   * a restore. `prepareTransaction` treats it as part of the transaction's identity, so it is
   * recomputed even when the fee value has not moved.
   *
   * `JsonSafeRecord`, not the raw estimation shape: this bag rides on the live `GenericTransaction`,
   * which the swap flow serialises with `JSON.stringify` — and that throws on a `bigint`. So
   * `prepareTransaction` normalises the estimation's `bigint` values to decimal strings before
   * storing them here (see `feeParametersToJsonSafe`).
   */
  feeParameters?: JsonSafeRecord;
};

export type GenericTransactionRaw = TransactionCommonRaw & {
  family: string;
  fees?: string | null;
  storageLimit?: string | null;
  customFees?: {
    parameters: { fees?: string | null };
  };
  tag?: number | null | undefined;
  nonce?: string | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  data?: string;
  mode?: GenericTransactionMode;
  type?: number | null;
  assetReference?: string | null;
  assetOwner?: string | null;
  networkInfo?: NetworkInfoRaw | null;
  chainId?: number | null;
  gasLimit?: string | null;
  customGasLimit?: string | null;
  gasPrice?: string | null;
  maxFeePerGas?: string | null;
  maxPriorityFeePerGas?: string | null;
  additionalFees?: string | null;
  gasOptions?: GasOptionsRaw;
  sponsored?: boolean;
  valAddress?: string;
  valId?: string;
  withdrawId?: string;
  dstValAddress?: string;
  /** @see GenericTransaction.familySpecificData — carried verbatim, hence the identical type. */
  familySpecificData?: JsonSafeRecord;
  // `feeParameters` is deliberately absent: derived from the last fee estimation, so persisting it
  // is how a stale figure survives a restore; the next `prepareTransaction` recomputes it.
};

export interface OperationCommon extends Operation {
  extra: Record<string, any>;
}

export interface OperationCommonRaw extends OperationRaw {
  extra: Record<string, any>;
}

export type LegacySigner = {
  signTransaction: (path: string, rawTxHex: string) => Promise<string>;
};

export type CoinFrameworkSigner<S = unknown> = {
  getAddress: GetAddressFn;
  signMessage?: (message: string) => Promise<string>;
  context: SignerContext<S>;
};

export type AccountRawAssignHooks = {
  assignFromAccountRaw?: AccountBridge<GenericTransaction>["assignFromAccountRaw"];
  assignToAccountRaw?: AccountBridge<GenericTransaction>["assignToAccountRaw"];
  /** The same pair for a token sub-account, without which `buildTokenAccountShapes` is lost on reload. */
  assignFromTokenAccountRaw?: AccountBridge<GenericTransaction>["assignFromTokenAccountRaw"];
  assignToTokenAccountRaw?: AccountBridge<GenericTransaction>["assignToTokenAccountRaw"];
  /**
   * Revive/serialize the family-owned part of `Operation.extra` (forwarded through
   * `Operation.details.familyExtra`). Without these the bag is persisted verbatim, so a non-JSON
   * value corrupts on revival. `AccountBridge` members on a different call path from the `assign*`
   * pair — `fromSignedOperationRaw` has no account in hand.
   *
   * The serialization layer calls these with the **whole** `Operation.extra` — the family's keys
   * merged with the framework's — and replaces `extra` wholesale with what is returned. Mapping only
   * the family's own keys is safe regardless: `accountRawAssign.ts` converts the framework-owned keys
   * itself and spreads this result over them, so a family cannot drop `ledgerOpType` or `stake`.
   *
   * `fromOperationExtraRaw` has a second caller: on a fresh sync `getAccountShape.ts` hands it
   * `details.familyExtra` alone — the family's own bag, with none of the framework's keys beside it.
   * It has to accept either input, which spreading the rest through rather than rebuilding a fixed
   * shape already achieves.
   *
   * The cost of that is no key can be dropped: the untouched input is the merge's base layer, so a
   * key these hooks omit is persisted verbatim rather than filtered out. A legacy bridge's hooks of
   * the same name replace instead of merge, so an allowlist ported from one (`coin-sui`'s
   * `bridge/formatters.ts` omits a `BigNumber` on purpose) stops filtering here — map such a key to a
   * JSON-safe form rather than relying on omission.
   */
  fromOperationExtraRaw?: AccountBridge<GenericTransaction>["fromOperationExtraRaw"];
  toOperationExtraRaw?: AccountBridge<GenericTransaction>["toOperationExtraRaw"];
};

export type SignTransactionOptions = {
  rawTxHex: string;
  path: string;
  transaction: Buffer;
};
