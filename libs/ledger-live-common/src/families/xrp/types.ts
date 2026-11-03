// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-xrp/types";

// Bridge related types
import type { NetworkInfo, NetworkInfoRaw } from "@ledgerhq/coin-xrp/types";
import type {
  Operation,
  TokenAccount,
  TokenAccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type XrpOperationExtra = {
  memo?: string;
};

export type XrpOperation = Operation<XrpOperationExtra>;

/**
 * `isLocked` when the issuer froze or locked the token, or has yet to authorize it. IOU only: `limit`
 * is the trust limit in the token's base units, and `isRippling` when the account's side of the line
 * lacks No Ripple.
 */
export type XrpTokenResources = { isLocked: boolean; limit?: BigNumber; isRippling?: boolean };
export type XrpTokenResourcesRaw = Omit<XrpTokenResources, "limit"> & { limit?: string };

export type XrpTokenAccount = TokenAccount & { xrpResources?: XrpTokenResources };
export type XrpTokenAccountRaw = TokenAccountRaw & { xrpResources?: XrpTokenResourcesRaw };

// "changeTrust" opts in to a token, or edits an IOU's limit: a TrustSet for an IOU, an
// MPTokenAuthorize for an MPT. "optOut" removes a held token.
type XrpTransactionMode = "send" | "changeTrust" | "optOut";

// An opt-in or an opt-out names its token here, without a token account
type XrpOptInFields = {
  mode?: XrpTransactionMode;
  assetReference?: string;
  assetOwner?: string;
};

export type Transaction = TransactionCommon &
  XrpOptInFields & {
    family: "xrp";
    fees: BigNumber | null | undefined;
    networkInfo: NetworkInfo | null | undefined;
    tag: number | null | undefined;
  };

export type TransactionRaw = TransactionCommonRaw &
  XrpOptInFields & {
    family: "xrp";
    fees: string | null | undefined;
    networkInfo: NetworkInfoRaw | null | undefined;
    tag: number | null | undefined;
  };

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

// Signer related types
export type XrpAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type XrpSignature = string; // `0x${string}`

export interface XrpSigner {
  getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    ed25519?: boolean,
  ): Promise<XrpAddress>;
  signTransaction(path: string, rawTxHex: string, ed25519?: boolean): Promise<XrpSignature>;
}
