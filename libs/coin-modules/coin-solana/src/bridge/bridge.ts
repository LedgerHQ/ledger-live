import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  GetAccountShape,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { minutes, makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { SOLANA_DUMMY_ADDRESS } from "../constants";
import { createTransaction } from "../createTransaction";
import { SolanaTxConfirmationTimeout, SolanaTxSimulationFailedWhilePendingOp } from "../errors";
import { estimateMaxSpendableWithAPI } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { broadcast } from "../logic/broadcast";
import { validateAddress } from "../logic/validateAddress";
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
  return async ({ account, signedOperation }) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(account.currency.id),
    };
    const api = getChainAPI(config);
    const { signature, operation, rawData } = signedOperation;
    const txBase64 = Buffer.from(signature, "hex").toString("base64");

    try {
      const txSignature = await broadcast(api, txBase64, {
        recentBlockhash: rawData?.recentBlockhash as BlockhashWithExpiryBlockHeight,
      });
      return patchOperationWithHash(operation, txSignature);
    } catch (e) {
      if (e instanceof Error) {
        log("broadcast-error", e.message);

        if (e.message.includes("simulation failed") && account.pendingOperations.length > 0) {
          throw new SolanaTxSimulationFailedWhilePendingOp();
        }

        if (e.message.includes("was not confirmed in")) {
          throw new SolanaTxConfirmationTimeout();
        }
      }

      throw e;
    }
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
    getEstimationRecipient: () => SOLANA_DUMMY_ADDRESS,
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
