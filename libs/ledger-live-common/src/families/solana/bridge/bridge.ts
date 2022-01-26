import {
  GetAccountShape,
  makeAccountBridgeReceive,
  makeSync as makeSyncHelper,
  makeScanAccounts as makeScanHelper,
} from "../../../bridge/jsHelpers";
import type {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  CurrencyBridge,
  SignOperationFnSignature,
} from "../../../types";
import type { Transaction } from "../types";
import { getAccountShapeWithAPI } from "../js-synchronization";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendableWithAPI from "../js-estimateMaxSpendable";
import createTransaction, { updateTransaction } from "../js-createTransaction";
import { signOperationWithAPI } from "../js-signOperation";
import { broadcastWithAPI } from "../js-broadcast";
import { prepareTransaction as prepareTransactionWithAPI } from "../js-prepareTransaction";
import { ChainAPI, Config } from "../api";
import { makeLRUCache } from "../../../cache";
import { endpointByCurrencyId } from "../utils";
import { minutes, seconds } from "../api/cached";
import hash from "object-hash";
import BigNumber from "bignumber.js";

function makePrepare(getChainAPI: (config: Config) => Promise<ChainAPI>) {
  async function prepareTransaction(
    mainAccount: Account,
    transaction: Transaction
  ) {
    const config: Config = {
      endpoint: endpointByCurrencyId(mainAccount.currency.id),
    };

    const chainAPI = await getChainAPI(config);
    return prepareTransactionWithAPI(mainAccount, transaction, chainAPI);
  }

  const cacheKeyByAccTx = (account: Account, tx: Transaction) =>
    hash({
      account: {
        id: account.id,
        address: account.freshAddress,
        syncDate: account.lastSyncDate.toISOString(),
      },
      tx: {
        recipient: tx.recipient,
        amount: tx.amount.toNumber(),
        useAllAmount: tx.useAllAmount,
        subAccountId: tx.subAccountId,
        model: tx.model,
      },
    });

  return makeLRUCache(prepareTransaction, cacheKeyByAccTx, seconds(30));
}

function makeSyncAndScan(getChainAPI: (config: Config) => Promise<ChainAPI>) {
  const getAccountShape: GetAccountShape = async (info) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.currency.id),
    };

    const chainAPI = await getChainAPI(config);
    return getAccountShapeWithAPI(info, chainAPI);
  };
  return {
    sync: makeSyncHelper(getAccountShape),
    scan: makeScanHelper(getAccountShape),
  };
}

function makeEstimateMaxSpendable(
  getChainAPI: (config: Config) => Promise<ChainAPI>
) {
  async function estimateMaxSpendable(
    arg: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0]
  ): Promise<BigNumber> {
    const { account, parentAccount } = arg;

    const currencyId =
      account.type === "Account"
        ? account.currency.id
        : parentAccount?.currency.id;

    if (currencyId === undefined) {
      throw new Error("currency not found");
    }

    const config: Config = {
      endpoint: endpointByCurrencyId(currencyId),
    };

    const api = await getChainAPI(config);

    return estimateMaxSpendableWithAPI(arg, api);
  }

  const cacheKeyByAccBalance = ({ account }: { account: AccountLike }) =>
    `${account.id}:${account.balance.toString()}`;

  return makeLRUCache(estimateMaxSpendable, cacheKeyByAccBalance, minutes(5));
}

function makeBroadcast(
  getChainAPI: (config: Config) => Promise<ChainAPI>
): BroadcastFnSignature {
  return async (info) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.account.currency.id),
    };
    const api = await getChainAPI(config);
    return broadcastWithAPI(info, api);
  };
}

function makeSign(
  getChainAPI: (config: Config) => Promise<ChainAPI>
): SignOperationFnSignature<Transaction> {
  return (info) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.account.currency.id),
    };
    const api = () => getChainAPI(config);
    return signOperationWithAPI(info, api);
  };
}

export function makeBridges({
  getAPI,
  getQueuedAPI,
  getQueuedAndCachedAPI,
}: {
  getAPI: (config: Config) => Promise<ChainAPI>;
  getQueuedAPI: (config: Config) => Promise<ChainAPI>;
  getQueuedAndCachedAPI: (config: Config) => Promise<ChainAPI>;
}): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction>;
} {
  const { sync, scan } = makeSyncAndScan(getQueuedAPI);

  const accountBridge: AccountBridge<Transaction> = {
    createTransaction,
    updateTransaction,
    estimateMaxSpendable: makeEstimateMaxSpendable(getQueuedAndCachedAPI),
    getTransactionStatus,
    sync,
    receive: makeAccountBridgeReceive(),
    prepareTransaction: makePrepare(getQueuedAndCachedAPI),
    broadcast: makeBroadcast(getAPI),
    signOperation: makeSign(getAPI),
  };

  const currencyBridge: CurrencyBridge = {
    preload: async (): Promise<any> => {},
    hydrate: (): void => {},
    scanAccounts: scan,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
