import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  GetAccountShape,
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import type { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
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
import { prepareTransaction as prepareTransactionWithAPI } from "../prepareTransaction";
import {
  assignFromAccountRaw,
  assignFromTokenAccountRaw,
  assignToAccountRaw,
  assignToTokenAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import { buildSignOperation } from "../signOperation";
import { SolanaSigner } from "../signer";
import { getAccountShapeWithAPI } from "../synchronization";
import type { SolanaAccount, Transaction, TransactionStatus } from "../types";
import { endpointByCurrencyId } from "../utils";
import coinConfig from "../config";

function makePrepare(getChainAPI: (config: Config) => ChainAPI) {
  const prepareTransaction: AccountBridge<Transaction, SolanaAccount>["prepareTransaction"] = (
    mainAccount,
    transaction,
  ) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(
        coinConfig.getCoinConfig(mainAccount.currency.id),
        mainAccount.currency.id,
      ),
    };

    const chainAPI = getChainAPI(config);
    return prepareTransactionWithAPI(mainAccount, transaction, chainAPI);
  };

  return prepareTransaction;
}

function makeSyncAndScan(getChainAPI: (config: Config) => ChainAPI, getAddress: GetAddressFn) {
  const getAccountShape: GetAccountShape<SolanaAccount> = info => {
    const config: Config = {
      endpoint: endpointByCurrencyId(coinConfig.getCoinConfig(info.currency.id), info.currency.id),
    };

    const chainAPI = getChainAPI(config);
    return getAccountShapeWithAPI(info, chainAPI);
  };
  return {
    sync: makeSync({ getAccountShape }),
    scan: makeScanAccounts({ getAccountShape, getAddressFn: getAddress }),
  };
}

/**
 * Cache key for estimateMaxSpendable.
 *
 * Include pending operations so new outgoing txs bust the cache and "send max" stays correct.
 * See: https://ledgerhq.atlassian.net/browse/LIVE-35129
 */
export const estimateMaxSpendableCacheKey = ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): string => {
  const mainAccount = getMainAccount(account, parentAccount);
  const pendingOpsSig = (mainAccount.pendingOperations ?? []).map(op => op.hash).join(",");
  return `${account.id}:${account.spendableBalance.toString()}:pending:${pendingOpsSig}:tx:${
    transaction?.model.kind ?? "<no transaction>"
  }`;
};

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
      endpoint: endpointByCurrencyId(coinConfig.getCoinConfig(currencyId), currencyId),
    };

    const api = getChainAPI(config);

    return estimateMaxSpendableWithAPI(arg, api);
  };

  return makeLRUCache(estimateMaxSpendable, estimateMaxSpendableCacheKey, minutes(5));
}

function makeBroadcast(
  getChainAPI: (config: Config) => ChainAPI,
): AccountBridge<Transaction, SolanaAccount>["broadcast"] {
  return async ({ account, signedOperation }) => {
    const config: Config = {
      endpoint: endpointByCurrencyId(
        coinConfig.getCoinConfig(account.currency.id),
        account.currency.id,
      ),
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
      endpoint: endpointByCurrencyId(
        coinConfig.getCoinConfig(info.account.currency.id),
        info.account.currency.id,
      ),
    };
    const api = getChainAPI(config);
    return buildSignOperation(signerContext, api)(info);
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
    scanAccounts: scan,
    nftResolvers,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
