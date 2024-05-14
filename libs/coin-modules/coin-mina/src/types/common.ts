import {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { ValidatorInfo } from "../api/fetchValidators";

export type Transaction = TransactionCommon & {
  family: "mina";
  fees: {
    fee: BigNumber;
    accountCreationFee: BigNumber;
  };
  memo: string | undefined;
  nonce: number;
  txType?: "stake";
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "mina";
  fees: {
    fee: string;
    accountCreationFee: string;
  };
  memo: string | undefined;
  nonce: number;
  txType?: "stake";
};

export interface MinaAccount extends Account {
  resources?: {
    blockProducers: ValidatorInfo[];
    stakingActive: boolean;
    delegateInfo: ValidatorInfo | undefined;
    epochInfo: {
      epoch: string;
      slot: string;
      globalSlot: string;
      startTime: string;
      endTime: string;
    };
  };
}

export type MinaAPIAccount = {
  blockHeight: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
};

export type MinaAccountRaw = AccountRaw & {
  resources: {
    blockProducers: ValidatorInfo[];
    stakingActive: boolean;
    delegateInfo: ValidatorInfo | undefined;
    epochInfo: {
      epoch: string;
      slot: string;
      globalSlot: string;
      startTime: string;
      endTime: string;
    };
  };
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
  transaction?: Error;
};

export type MinaUnsignedTransaction = {
  txType: TxType;
  senderAccount: number;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  fee: number;
  nonce: number;
  memo: string;
  networkId: number;
};

export interface MinaSignedTransaction {
  signature: string;
  transaction: MinaUnsignedTransaction;
}

export type MinaOperation = Operation<{ memo: string | undefined; accountCreationFee: string }>;

export enum TxType {
  PAYMENT = 0x00,
  DELEGATION = 0x04,
}
