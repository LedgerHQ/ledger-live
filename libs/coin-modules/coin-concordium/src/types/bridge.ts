import type {
  Account,
  AccountLike,
  AccountRaw,
  CurrencyBridge,
  Operation,
  TokenAccount,
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
 * cast, so a consumer needs this type to reach either field. Both are plain
 * strings and survive the framework's own serialization, so no
 * `toOperationExtraRaw` hook is involved.
 */
export type ConcordiumOperationExtra = {
  memo?: string;
  pltRejectCode?: PltRejectCode;
};

export type ConcordiumOperation = Operation<ConcordiumOperationExtra>;

/**
 * Reads `extra` into the fields that are safe to pass on.
 *
 * `extra` has been written to disk and read back, so nothing about its shape is
 * guaranteed. Only a non-empty string memo survives, and only a reject code
 * this module recognises: callers interpolate the code, so an unrecognised one
 * has to be dropped rather than handed through.
 *
 * Shared by every caller so none can differ on what it considers safe.
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
  /** Reported before any list cause. Absent means the module never declared it, not `false`. */
  paused?: boolean;
};

/** The state to report for one token. */
export type ConcordiumTokenNotice =
  | "paused"
  | "notAllowed"
  | "denied"
  | "unverified"
  | "notPermitted";

/**
 * The `errors.*` entry whose copy each notice reuses.
 *
 * The send path raises the error of the same name, so both paths name the cause
 * in the same words. Shared so the two apps cannot drift on which copy belongs
 * to which state.
 */
export const CONCORDIUM_TOKEN_NOTICE_ERROR = {
  paused: "ConcordiumTokenPaused",
  notAllowed: "ConcordiumAccountNotAllowed",
  denied: "ConcordiumAccountDenied",
  unverified: "ConcordiumTokenRestrictionsUnverified",
  notPermitted: "ConcordiumTokenTransferNotPermitted",
} as const satisfies Record<ConcordiumTokenNotice, string>;

/**
 * Finds the state stored for one token.
 *
 * Keyed by `contractAddress`, as the send path keys it. `concordiumResources` is
 * non-optional on the type but absent on accounts persisted before it existed.
 */
function tokenStateFor(
  account: TokenAccount,
  parentAccount: Account | null | undefined,
): ConcordiumTokenResources | undefined {
  return (parentAccount as ConcordiumAccount | null | undefined)?.concordiumResources?.tokens?.[
    account.token.contractAddress
  ];
}

/**
 * Compile-time exhaustiveness without returning the off-union value at runtime:
 * a new {@link PltTransferStatus} member stops satisfying `never` and fails the
 * build here, while a corrupted store falls to the notice that names no cause.
 */
function unnamedRefusal(_unrecognised: never): "notPermitted" {
  return "notPermitted";
}

/**
 * Picks the one state to report for a token held by an account.
 *
 * Mirrors `validateTokenPolicy` branch for branch, so a caller reports the cause
 * the send path would refuse on. Only `"allowed"` yields no notice; a value off
 * the union does not read as permission.
 *
 * Returns undefined for an account that is not a token.
 */
export function tokenNoticeFor(
  account: AccountLike,
  parentAccount: Account | null | undefined,
): ConcordiumTokenNotice | undefined {
  if (account.type !== "TokenAccount") return undefined;

  const state = tokenStateFor(account, parentAccount);
  if (!state) return "unverified";
  if (state.paused === true) return "paused";

  switch (state.transferStatus) {
    case "allowed":
      return undefined;
    case "unknown":
      return "unverified";
    case "notAllowed":
      return "notAllowed";
    case "denied":
      return "denied";
    case "blocked":
      return "notPermitted";
    default:
      return unnamedRefusal(state.transferStatus);
  }
}

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
