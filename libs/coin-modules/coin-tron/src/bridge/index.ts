import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import tronCoinConfig, { type TronCoinConfig } from "../config";
import signerGetAddress from "../signer";
import {
  type Transaction,
  type TransactionRaw,
  type TransactionStatus,
  type TronAccount,
  TronSigner,
} from "../types";
import broadcast from "./broadcast";
import createTransaction from "./createTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import { hydrate, preload } from "./preload";
import { prepareTransaction } from "./prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, sync } from "./synchronization";
import { serialization } from "./transaction";

function buildCurrencyBridge(signerContext: SignerContext<TronSigner>): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload,
    hydrate,
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<TronSigner>,
): AccountBridge<Transaction, TronAccount, TransactionStatus, TransactionRaw> {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    getSerializedAddressParameters,
    ...serialization,
  };
}

export type TronBridge = Bridge<Transaction, TronAccount, TransactionStatus, TransactionRaw>;

export function createBridges(
  signerContext: SignerContext<TronSigner>,
  coinConfig: CoinConfig<TronCoinConfig>,
): TronBridge {
  tronCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
