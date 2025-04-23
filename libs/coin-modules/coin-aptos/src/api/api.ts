import type {
  Api,
  Balance,
  BlockInfo,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import type { AptosConfig as AptosConfigApi } from "../config";
import coinConfig from "../config";
import type { AptosAsset } from "../types/assets";

export function createApi(config: AptosConfigApi): Api<AptosAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

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

  const broadcast: broadcastFunc = async _tx => {
    throw NotImplemented();
  };

  const combine: combineFunc = (_tx, _signature, _pubkey) => {
    throw NotImplemented();
  };

  const craftTransaction: craftTransactionFunc = async (_transactionIntent, _customFees) => {
    throw NotImplemented();
  };

  const estimateFees: estimateFeesFunc = async _transactionIntent => {
    throw NotImplemented();
  };

  const getBalance: getBalanceFunc = async _address => {
    throw NotImplemented();
  };

  const lastBlock: lastBlockFunc = async () => {
    throw NotImplemented();
  };

  const listOperations: listOperationsFunc = async (_address, _pagination) => {
    throw NotImplemented();
  };

  return {
    broadcast,
    combine,
    craftTransaction,
    estimateFees,
    getBalance,
    lastBlock,
    listOperations,
  };
}
