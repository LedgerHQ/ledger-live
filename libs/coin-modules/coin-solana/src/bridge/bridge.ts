import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
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
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcastWithAPI } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendableWithAPI } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { ChainAPI, Config } from "../network";
import nftResolvers from "../nftResolvers";
import { PRELOAD_MAX_AGE, preloadWithAPI } from "../preload";
import { prepareTransaction as prepareTransactionWithAPI } from "../prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
  assignFromTokenAccountRaw,
  assignToTokenAccountRaw,
} from "../serialization";
import { buildSignOperation } from "../signOperation";
import { SolanaSigner } from "../signer";
import { getAccountShapeWithAPI } from "../synchronization";
import type { SolanaAccount, SolanaPreloadDataV1, Transaction, TransactionStatus } from "../types";
import { endpointByCurrencyId } from "../utils";
import { validateAddress } from "../validateAddress";

function makePrepare(getChainAPI: (config: Config) => ChainAPI) {
  const prepareTransaction: AccountBridge<Transaction, SolanaAccount>["prepareTransaction"] = (
    mainAccount,
    transaction,
  ) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(mainAccount.currency.id),
    };

    const chainAPI = getChainAPI(config);
    return prepareTransactionWithAPI(mainAccount, transaction, chainAPI);
  };

  return prepareTransaction;
}

function makeSyncAndScan(getChainAPI: (config: Config) => ChainAPI, getAddress: GetAddressFn) {
  const getAccountShape: GetAccountShape<SolanaAccount> = info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.currency.id),
    };

    const chainAPI = getChainAPI(config);
    return getAccountShapeWithAPI(info, chainAPI);
  };
  return {
    sync: makeSync({ getAccountShape }),
    scan: makeScanAccounts({ getAccountShape, getAddressFn: getAddress }),
  };
}

function makeEstimateMaxSpendable(getChainAPI: (config: Config) => ChainAPI) {
  const estimateMaxSpendable: AccountBridge<
    Transaction,
    SolanaAccount
  >["estimateMaxSpendable"] = arg => {
    const { account, parentAccount } = arg;

    const currencyId =
      account.type === "Account" ? account.currency.id : parentAccount?.currency.id;

    if (currencyId === undefined) {
      throw new Error("currency not found");
    }

    const config: Config = {
      endpoint: endpointByCurrencyId(currencyId),
    };

    const api = getChainAPI(config);

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
  getChainAPI: (config: Config) => ChainAPI,
): AccountBridge<Transaction, SolanaAccount>["broadcast"] {
  return info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.account.currency.id),
    };
    const api = getChainAPI(config);
    return broadcastWithAPI(info, api);
  };
}

function makeSign(
  getChainAPI: (config: Config) => ChainAPI,
  signerContext: SignerContext<SolanaSigner>,
): AccountBridge<Transaction, SolanaAccount>["signOperation"] {
  return info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(info.account.currency.id),
    };
    const api = getChainAPI(config);
    return buildSignOperation(signerContext, api)(info);
  };
}

function makePreload(getChainAPI: (config: Config) => ChainAPI): CurrencyBridge["preload"] {
  const preload: CurrencyBridge["preload"] = (currency): Promise<SolanaPreloadDataV1> => {
    const config: Config = {
      endpoint: endpointByCurrencyId(currency.id),
    };
    const api = getChainAPI(config);
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
  signerContext,
}: {
  getAPI: (config: Config) => ChainAPI;
  signerContext: SignerContext<SolanaSigner>;
}): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, SolanaAccount, TransactionStatus>;
} {
  const getAddress = resolver(signerContext);
  const { sync, scan } = makeSyncAndScan(getAPI, getAddress);

  const accountBridge: AccountBridge<Transaction, SolanaAccount, TransactionStatus> = {
    createTransaction,
    updateTransaction,
    estimateMaxSpendable: makeEstimateMaxSpendable(getAPI),
    getTransactionStatus,
    sync,
    receive: makeAccountBridgeReceive(getAddress),
    prepareTransaction: makePrepare(getAPI),
    broadcast: makeBroadcast(getAPI),
    signOperation: makeSign(getAPI, signerContext),
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    assignFromAccountRaw,
    assignToAccountRaw,
    toOperationExtraRaw,
    fromOperationExtraRaw,
    getSerializedAddressParameters,
    assignFromTokenAccountRaw,
    assignToTokenAccountRaw,
    validateAddress,
  };

  const currencyBridge: CurrencyBridge = {
    preload: makePreload(getAPI),
    hydrate: (_data: unknown, _currency: CryptoCurrency) => {},
    scanAccounts: scan,
    getPreloadStrategy,
    nftResolvers,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
