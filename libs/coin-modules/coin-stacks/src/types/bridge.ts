import {
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";

import { StacksNetwork } from "../network/api";

export type FamilyType = "stacks";
export const TokenPrefix = "stacks/sip010/";

export type NetworkInfo = {
  family: FamilyType;
};
export type NetworkInfoRaw = {
  family: FamilyType;
};

export type StacksTransactionMode = "send" | "delegate" | "undelegate";

export type StacksFamilySpecificData = {
  numCycles?: number;
  startBurnHt?: number;
};

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fee?: BigNumber;
  /** The `GenericTransaction` fee field (generic-coin-framework/types.ts) -- read this once the
   * documented flag-flip PR routes Stacks through the generic bridge, which never sets `fee`. */
  fees?: BigNumber | null;
  nonce?: BigNumber;
  memo?: string;
  network: keyof typeof StacksNetwork;
  anchorMode: AnchorMode;
  /** pox-5 staking mode; unset (or "send") on a classic transfer. */
  mode?: StacksTransactionMode;
  /** pox-5 signer-manager contract principal (the staking pool); unused on a transfer. */
  valAddress?: string;
  familySpecificData?: StacksFamilySpecificData;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fee?: string;
  fees?: string | null;
  nonce?: string;
  memo?: string;
  network: string;
  anchorMode: number;
  mode?: StacksTransactionMode;
  valAddress?: string;
  familySpecificData?: StacksFamilySpecificData;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StacksOperation = Operation<StacksOperationExtra>;

export type StacksOperationExtra = {
  memo?: string | undefined;
};
