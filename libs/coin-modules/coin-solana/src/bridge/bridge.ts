import {
  getSerializedAddressParameters,
  updateTransaction,
  GetAccountShape,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { minutes, makeLRUCache } from "@ledgerhq/live-network/cache";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import type { SolanaAccount, SolanaPreloadDataV1, Transaction, TransactionStatus } from "../types";
import { prepareTransaction as prepareTransactionWithAPI } from "../prepareTransaction";
import { estimateMaxSpendableWithAPI } from "../estimateMaxSpendable";
import { PRELOAD_MAX_AGE, hydrate, preloadWithAPI } from "../preload";
import { getTransactionStatus } from "../getTransactionStatus";
import { getAccountShapeWithAPI } from "../synchronization";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { endpointByCurrencyId } from "../utils";
import { broadcastWithAPI } from "../broadcast";
import { ChainAPI, Config } from "../api";
import { SolanaSigner } from "../signer";
import resolver from "../hw-getAddress";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

function makePrepare(getChainAPI: (config: Config) => Promise<ChainAPI>) {
  const prepareTransaction: AccountBridge<
    Transaction,
    SolanaAccount
  >["prepareTransaction"] = async (mainAccount, transaction) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(mainAccount.currency.id),
    };

    const chainAPI = await getChainAPI(config);
    return prepareTransactionWithAPI(mainAccount, transaction, chainAPI);
  };

  return prepareTransaction;
}

function makeSyncAndScan(
  getChainAPI: (config: Config) => Promise<ChainAPI>,
  getAddress: GetAddressFn,
) {
  const getAccountShape: GetAccountShape<SolanaAccount> = async info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.currency.id),
    };

    const chainAPI = await getChainAPI(config);
    return getAccountShapeWithAPI(info, chainAPI);
  };
  return {
    sync: makeSync({ getAccountShape }),
    scan: makeScanAccounts({ getAccountShape, getAddressFn: getAddress }),
  };
}

function makeEstimateMaxSpendable(getChainAPI: (config: Config) => Promise<ChainAPI>) {
  const estimateMaxSpendable: AccountBridge<
    Transaction,
    SolanaAccount
  >["estimateMaxSpendable"] = async arg => {
    const { account, parentAccount } = arg;

    const currencyId =
      account.type === "Account" ? account.currency.id : parentAccount?.currency.id;

    if (currencyId === undefined) {
      throw new Error("currency not found");
    }

    const config: Config = {
      endpoint: endpointByCurrencyId(currencyId),
    };

    const api = await getChainAPI(config);

    return estimateMaxSpendableWithAPI(arg, api);
  };

  const cacheKeyByAccSpendableBalance = ({
    account,
    transaction,
  }: {
    account: AccountLike;
    transaction?: Transaction | null | undefined;
  }) => {
    return `${account.id}:${account.spendableBalance.toString()}:tx:${
      transaction?.model.kind ?? "<no transaction>"
    }`;
  };

  return makeLRUCache(estimateMaxSpendable, cacheKeyByAccSpendableBalance, minutes(5));
}

function makeBroadcast(
  getChainAPI: (config: Config) => Promise<ChainAPI>,
): AccountBridge<Transaction, SolanaAccount>["broadcast"] {
  return async info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.account.currency.id),
    };
    const api = await getChainAPI(config);
    return broadcastWithAPI(info, api);
  };
}

function makeSign(
  getChainAPI: (config: Config) => Promise<ChainAPI>,
  signerContext: SignerContext<SolanaSigner>,
): AccountBridge<Transaction, SolanaAccount>["signOperation"] {
  return info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.account.currency.id),
    };
    const api = () => getChainAPI(config);
    return buildSignOperation(signerContext, api)(info);
  };
}

function makePreload(
  getChainAPI: (config: Config) => Promise<ChainAPI>,
): CurrencyBridge["preload"] {
  const preload: CurrencyBridge["preload"] = (currency): Promise<SolanaPreloadDataV1> => {
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
  signerContext,
}: {
  getAPI: (config: Config) => Promise<ChainAPI>;
  getQueuedAPI: (config: Config) => Promise<ChainAPI>;
  getQueuedAndCachedAPI: (config: Config) => Promise<ChainAPI>;
  signerContext: SignerContext<SolanaSigner>;
}): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, SolanaAccount, TransactionStatus>;
} {
  const getAddress = resolver(signerContext);
  const { sync, scan } = makeSyncAndScan(getQueuedAPI, getAddress);

  const accountBridge: AccountBridge<Transaction, SolanaAccount, TransactionStatus> = {
    createTransaction,
    updateTransaction,
    estimateMaxSpendable: makeEstimateMaxSpendable(getQueuedAndCachedAPI),
    getTransactionStatus,
    sync,
    receive: makeAccountBridgeReceive(getAddress),
    prepareTransaction: makePrepare(getQueuedAndCachedAPI),
    broadcast: makeBroadcast(getAPI),
    signOperation: makeSign(getAPI, signerContext),
    assignFromAccountRaw,
    assignToAccountRaw,
    toOperationExtraRaw,
    fromOperationExtraRaw,
    getSerializedAddressParameters,
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
