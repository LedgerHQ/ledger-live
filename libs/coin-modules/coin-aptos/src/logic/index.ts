import {
  Balance,
  BlockInfo,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/lib-es/api/types";
import { AptosAsset } from "../types/assets";

type broadcastFunc = (tx: string) => Promise<string>;
type combineFunc = (tx: string, signature: string, pubkey?: string) => string;
type craftTransactionFunc = (
  transactionIntent: TransactionIntent<AptosAsset>,
  customFees?: bigint,
) => Promise<string>;
type estimateFeesFunc = (transactionIntent: TransactionIntent<AptosAsset>) => Promise<bigint>;
type getBalanceFunc = (address: string) => Promise<Balance<AptosAsset>[]>;
type lastBlockFunc = () => Promise<BlockInfo>;
type listOperationsFunc = (
  address: string,
  pagination: Pagination,
) => Promise<[Operation<AptosAsset>[], string]>;

function NotImplemented(): Error {
  return new Error("Not Implemented");
}

export const broadcast: broadcastFunc = async _tx => {
  throw NotImplemented();
};

export const combine: combineFunc = (_tx, _signature, _pubkey) => {
  throw NotImplemented();
};

export const craftTransaction: craftTransactionFunc = async (_transactionIntent, _customFees) => {
  throw NotImplemented();
};

export const estimateFees: estimateFeesFunc = async _transactionIntent => {
  throw NotImplemented();
};

export const getBalance: getBalanceFunc = async _address => {
  throw NotImplemented();
};

export const lastBlock: lastBlockFunc = async () => {
  throw NotImplemented();
};

export const listOperations: listOperationsFunc = async (_address, _pagination) => {
  throw NotImplemented();
};
