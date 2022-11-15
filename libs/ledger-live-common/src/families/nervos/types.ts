import Xpub from "./xpub";
import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export type NervosResources = {
  xpub: Xpub;
  freshChangeAddress: string;
  freshChangeAddressPath: string;
};

export type NervosResourcesRaw = {
  xpub: any;
  freshChangeAddress: string;
  freshChangeAddressPath: string;
};

export type NervosAccount = Account & { nervosResources?: NervosResources };

export type NervosAccountRaw = AccountRaw & {
  nervosResources?: NervosResourcesRaw;
};

export type Transaction = TransactionCommon & {
  family: "nervos";
  mode: "SendCKB";
  feePerByte: BigNumber;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "nervos";
  mode: "SendCKB";
  feePerByte: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface TX extends CKBComponents.Transaction {
  account: number;
  index: number;
  status: CKBComponents.TransactionStatus;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  previousTxs: CKBComponents.Transaction[];
}

export interface Cell {
  outPoint: CKBComponents.OutPoint;
  output: CKBComponents.CellOutput;
  outputData?: CKBComponents.Bytes;
}
