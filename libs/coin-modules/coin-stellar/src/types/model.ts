import { Horizon } from "@stellar/stellar-sdk";
import type { BigNumber } from "bignumber.js";

export type NetworkInfo = {
  family: "stellar";
  fees: BigNumber;
  baseFee: BigNumber;
  baseReserve: BigNumber;
  networkCongestionLevel?: NetworkCongestionLevel | undefined;
};

export type NetworkInfoRaw = {
  family: "stellar";
  fees: string;
  baseFee: string;
  baseReserve: string;
  networkCongestionLevel?: NetworkCongestionLevel | undefined;
};

export enum NetworkCongestionLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export const StellarMemoType = [
  "NO_MEMO",
  "MEMO_TEXT",
  "MEMO_ID",
  "MEMO_HASH",
  "MEMO_RETURN",
] as const;

// typesafe enum
export type StellarMemoKind = (typeof StellarMemoType)[number];

export type StellarMemo =
  | { type: "NO_MEMO" }
  | { type: Exclude<StellarMemoKind, "NO_MEMO">; value: string };

export type RawOperation = Horizon.ServerApi.OperationRecord & {
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  to_muxed?: string;
  funder?: string;
  trustor?: string;
  account?: string;
  transaction_successful: boolean;
};

export type BalanceAsset = {
  balance: string;
  limit: string;
  buying_liabilities: string;
  selling_liabilities: string;
  last_modified_ledger: number;
  is_authorized: boolean;
  is_authorized_to_maintain_liabilities: boolean;
  asset_type: string;
  asset_code: string;
  asset_issuer: string;
  liquidity_pool_id?: string;
};

export type Signer = {
  weight: number;
  key: string;
  type: string;
};
