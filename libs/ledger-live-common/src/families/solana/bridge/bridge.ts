import BigNumber from "bignumber.js";
import {
  GetAccountShape,
  makeAccountBridgeReceive,
  makeScanAccounts as makeScanHelper,
  makeSync as makeSyncHelper,
} from "../../../bridge/jsHelpers";
import { makeLRUCache } from "../../../cache";
import type {
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  CurrencyBridge,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { ChainAPI, Config } from "../api";
import { minutes } from "../api/cached";
import { broadcastWithAPI } from "../js-broadcast";
import createTransaction, { updateTransaction } from "../js-createTransaction";
import estimateMaxSpendableWithAPI from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import { PRELOAD_MAX_AGE, hydrate, preloadWithAPI } from "../js-preload";
import { prepareTransaction as prepareTransactionWithAPI } from "../js-prepareTransaction";
import { signOperationWithAPI } from "../js-signOperation";
import { getAccountShapeWithAPI } from "../js-synchronization";
import type { SolanaAccount, Transaction } from "../types";
import { endpointByCurrencyId } from "../utils";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";

function makePrepare(getChainAPI: (config: Config) => Promise<ChainAPI>) {
  async function prepareTransaction(
    mainAccount: SolanaAccount,
    transaction: Transaction
  ) {
    const config: Config = {
      endpoint: endpointByCurrencyId(mainAccount.currency.id),
    };

    const chainAPI = await getChainAPI(config);
    return prepareTransactionWithAPI(mainAccount, transaction, chainAPI);
  }

  return prepareTransaction;
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
    sync: makeSyncHelper({ getAccountShape }),
    scan: makeScanHelper({ getAccountShape }),
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

  const cacheKeyByAccSpendableBalance = ({
    account,
    transaction,
  }: {
    account: AccountLike;
    transaction?: Transaction | null;
  }) => {
    if (account.type === "ChildAccount") {
      throw new Error("unsupported account type");
    }
    return `${account.id}:${account.spendableBalance.toString()}:tx:${
      transaction?.model.kind ?? "<no transaction>"
    }`;
  };

  return makeLRUCache(
    estimateMaxSpendable,
    cacheKeyByAccSpendableBalance,
    minutes(5)
  );
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

function makePreload(
  getChainAPI: (config: Config) => Promise<ChainAPI>
): CurrencyBridge["preload"] {
  const preload = (currency: CryptoCurrency): Promise<Record<string, any>> => {
    const config: Config = {
      endpoint: endpointByCurrencyId(currency.id),
    };
    const api = () => getChainAPI(config);
    return preloadWithAPI(currency, api);
  };
  return preload;
}

function getPreloadStrategy() {
  return {
    preloadMaxAge: PRELOAD_MAX_AGE,
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
    assignFromAccountRaw,
    assignToAccountRaw,
  };

  const currencyBridge: CurrencyBridge = {
    preload: makePreload(getQueuedAndCachedAPI),
    hydrate,
    scanAccounts: scan,
    getPreloadStrategy,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
