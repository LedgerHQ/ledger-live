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
import type BigNumber from "bignumber.js";

export type XrpOperationExtra = {
  memo?: string;
};

export type XrpOperation = Operation<XrpOperationExtra>;

/**
 * `isLocked`: the token can only go back to its issuer. IOU only: `limit`, the holder's trust limit
 * in token base units, and `isRippling`, the holder's side of the line lacks No Ripple.
 */
export type XrpTokenResources = { isLocked: boolean; limit?: BigNumber; isRippling?: boolean };
type XrpTokenResourcesRaw = { isLocked: boolean; limit?: string; isRippling?: boolean };

export type XrpTokenAccount = TokenAccount & { xrpResources?: XrpTokenResources };
export type XrpTokenAccountRaw = TokenAccountRaw & { xrpResources?: XrpTokenResourcesRaw };

/**
 * `changeTrust` opts in to a token or edits its trust limit, the `amount`. `assetReference` and
 * `assetOwner` name the token, never a `subAccountId`: it adds a pending token sub-operation worth
 * the limit, which locks the token balance until the next sync.
 * `noRipple: false` lets rippling through the trust line; any other value blocks it.
 */
type XrpTokenFields = {
  mode?: "send" | "changeTrust";
  assetReference?: string;
  assetOwner?: string;
  noRipple?: boolean;
};

export type Transaction = TransactionCommon &
  XrpTokenFields & {
    family: "xrp";
    fees: BigNumber | null | undefined;
    networkInfo: NetworkInfo | null | undefined;
    tag: number | null | undefined;
  };

export type TransactionRaw = TransactionCommonRaw &
  XrpTokenFields & {
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
