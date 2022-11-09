import { StacksNetworkName } from "@stacks/network/dist";
import { AnchorMode } from "@stacks/transactions/dist/constants";
import { BigNumber } from "bignumber.js";

import {
  BroadcastArg0,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import {
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

type FamilyType = "stacks";

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
  network: StacksNetworkName;
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

export type BroadcastFnSignature = (arg0: BroadcastArg0) => Promise<Operation>;

export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;
export const reflect = (_declare: any) => {};
