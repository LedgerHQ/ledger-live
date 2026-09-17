import type {
  Account,
  AccountRaw,
  CurrencyBridge,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";
import type { Observable } from "rxjs";
import type { PltTransferStatus } from "./network";
import { isPltRejectCode, type PltRejectCode } from "./operation";
import type {
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
} from "./onboard";

/**
 * What this family puts on `Operation.extra`.
 *
 * `Operation` leaves `extra` as `unknown`, which cannot be read from without a
 * cast, so a renderer needs this type to see either field. Both are plain
 * strings and survive the framework's own serialization, so no
 * `toOperationExtraRaw` hook is involved.
 */
export type ConcordiumOperationExtra = {
  memo?: string;
  pltRejectCode?: PltRejectCode;
};

export type ConcordiumOperation = Operation<ConcordiumOperationExtra>;

/**
 * Reads the fields a renderer displays, keeping only what is safe to show.
 *
 * `extra` has been written to disk and read back by the time a renderer sees it,
 * so nothing about its shape is guaranteed. An object memo throws as a React
 * child, an empty one renders a titled row with nothing in it, and the reject
 * code becomes a translation key — so an unrecognised code has to be dropped
 * rather than looked up.
 *
 * Shared by both apps so the two cannot drift on what they consider displayable.
 */
export function readOperationExtra(extra: unknown): ConcordiumOperationExtra {
  const fields = (typeof extra === "object" && extra !== null ? extra : {}) as Record<
    string,
    unknown
  >;
  const memo = typeof fields.memo === "string" && fields.memo.length > 0 ? fields.memo : undefined;
  const code = isPltRejectCode(fields.pltRejectCode) ? fields.pltRejectCode : undefined;

  return {
    ...(memo === undefined ? {} : { memo }),
    ...(code === undefined ? {} : { pltRejectCode: code }),
  };
}

export interface ConcordiumCurrencyBridge extends CurrencyBridge {
  pairWalletConnect: (
    currencyId: string,
    deviceId: string,
  ) => Observable<ConcordiumPairingProgress>;
  onboardAccount: (
    currencyId: string,
    deviceId: string,
    creatableAccount: Account,
  ) => Observable<ConcordiumOnboardProgress | ConcordiumOnboardResult>;
}

/**
 * `energy` is the estimate signing will read instead of re-estimating, so the
 * fee shown and the device's "Max fees" come from one estimate. Not yet in
 * force: `signOperation` still calls `estimateFees` (LIVE-28337).
 *
 * It is a `number` on both sides, unlike `fee`, because `number` is what
 * `getTransactionCost` returns — MultiversX's `gasLimit`, not EVM's.
 */
export type Transaction = TransactionCommon & {
  family: "concordium";
  fee: BigNumber | null | undefined;
  memo: string | undefined;
  tokenId?: string;
  energy?: number;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "concordium";
  fee: string | null | undefined;
  memo: string | undefined;
  tokenId?: string;
  energy?: number;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

/**
 * Per-token state the send path needs, cached on the parent account. It lives
 * here rather than on the token sub-account because `TokenAccount` is a closed
 * type with no `extra` field and no family slot.
 */
export type ConcordiumTokenResources = {
  transferStatus: PltTransferStatus;
  /** Display fact only. Absent means the module never declared it, not `false`. */
  paused?: boolean;
};

/**
 * Every value is JSON-safe, so the runtime and raw shapes coincide; they are
 * still declared and converted separately to match every other coin module.
 */
export type ConcordiumResources = {
  isOnboarded: boolean;
  credId: string;
  publicKey: string;
  identityIndex: number;
  credNumber: number;
  ipIdentity: number;
  tokens?: Record<string, ConcordiumTokenResources>;
};

export type ConcordiumResourcesRaw = {
  isOnboarded: boolean;
  credId: string;
  publicKey: string;
  identityIndex: number;
  credNumber: number;
  ipIdentity: number;
  tokens?: Record<string, ConcordiumTokenResources>;
};

export type ConcordiumAccount = Account & {
  concordiumResources: ConcordiumResources;
};

export type ConcordiumAccountRaw = AccountRaw & {
  concordiumResources: ConcordiumResourcesRaw;
};
