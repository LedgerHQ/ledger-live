import { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { StacksSip010Token } from "@ledgerhq/cryptoassets/data/stacks-sip010";

import {
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

import { StacksNetwork } from "../network/types/api";

export type FamilyType = "stacks";
export const TokenPrefix = "stacks/sip010/";

export type NetworkInfo = {
  family: FamilyType;
};
export type NetworkInfoRaw = {
  family: FamilyType;
};

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fee?: BigNumber;
  nonce?: BigNumber;
  memo?: string;
  network: keyof typeof StacksNetwork;
  anchorMode: AnchorMode;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fee?: string;
  nonce?: string;
  memo?: string;
  network: string;
  anchorMode: number;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StacksOperation = Operation<StacksOperationExtra>;

export type StacksOperationExtra = {
  memo?: string | undefined;
};

/**
 * Stacks currency data that will be preloaded.
 */
export type StacksPreloadData = {
  tokens: StacksSip010Token[];
};
