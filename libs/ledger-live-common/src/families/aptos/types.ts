import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { Types as AptosTypes } from "aptos";

export type AptosLikeTransaction = TransactionCommon & AptosTypes.Transaction;

export type Transaction = AptosLikeTransaction & {
  family: "aptos";
  // networkInfo: NetworkInfoRaw | null | undefined;
};

export type AptosLikeTransactionRaw = TransactionCommonRaw & {
  family: string;
  // mode: CosmosOperationMode;
  // networkInfo: CosmosLikeNetworkInfoRaw | null | undefined;
  // fees: string | null | undefined;
  // gas: string | null | undefined;
  // memo: string | null | undefined;
  // validators: CosmosDelegationInfoRaw[];
  // sourceValidator: string | null | undefined;
};

export type TransactionRaw = AptosLikeTransactionRaw & {
  family: "aptos";
  // networkInfo: NetworkInfoRaw | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
