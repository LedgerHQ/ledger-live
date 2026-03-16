// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-xrp/types";

// Bridge related types
import type { NetworkInfo, NetworkInfoRaw } from "@ledgerhq/coin-xrp/types";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

export type Transaction = TransactionCommon & {
  family: "xrp";
  fees: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "xrp";
  fees: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
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
