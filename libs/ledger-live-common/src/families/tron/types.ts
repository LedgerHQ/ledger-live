import type { TronOperationMode, TronResource, Vote } from "@ledgerhq/coin-tron/types/index";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import type { JsonSafeRecord } from "../../bridge/generic-coin-framework/types";

// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-tron/types/index";

/**
 * Compile-time guard that `T` survives the JSON round-trip `TransactionRaw` performs verbatim.
 * Applied where the bag is used, so a non-serializable field added to it fails to compile.
 */
type JsonSafeShape<T extends JsonSafeRecord> = T;

/**
 * Tron's chain-specific transaction fields. They live under `familySpecificData` rather than at the
 * top level because Tron runs on the generic coin framework, which transports this bag opaquely and
 * hands it to `families/tron/bridge/api.ts:buildIntentData` (ADR-047).
 *
 * Holds the inputs the user chose, written by the staking screens; every field is optional because a
 * plain send picks none of them. The fee telemetry coin-tron returns alongside its estimate travels
 * on `feeParameters` instead, so nothing here has to be merged between estimations.
 */
export type TronFamilySpecificData = {
  /** Which resource a freeze/unfreeze/undelegate acts on. */
  resource?: TronResource | null;
  /** Super-representative votes, for `vote`. */
  votes?: Vote[];
  /** Freeze duration in days. */
  duration?: number;
};

/** The Tron transaction as the apps see it. */
export type Transaction = TransactionCommon & {
  family: "tron";
  mode: TronOperationMode;
  fees?: BigNumber | null;
  familySpecificData?: JsonSafeShape<TronFamilySpecificData>;
  /**
   * coin-tron's energy/bandwidth breakdown for the last fee estimation, written by the generic
   * `prepareTransaction` and read by `descriptor/index.ts`. Typed as the framework types it, since
   * that layer assigns it verbatim. Derived, so `TransactionRaw` deliberately omits it.
   */
  feeParameters?: Record<string, unknown>;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "tron";
  mode: TronOperationMode;
  fees?: string | null;
  familySpecificData?: JsonSafeShape<TronFamilySpecificData>;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
