import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getPreloadStrategy, preload, hydrate } from "./preload";
import { getTransactionStatus } from "./getTransactionStatus";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  toOperationExtraRaw,
  fromOperationExtraRaw,
} from "./serialization";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import resolver from "../signer/hw-getAddress";
import type { CeloAccount, Transaction, TransactionRaw } from "../types";
import { broadcast } from "./broadcast";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { getAccountShape } from "./synchronisation";
import { buildSignOperation } from "./signOperation";
import { sync } from "./synchronisation";
import { CeloSigner } from "../signer/signer";
import serialization from "./transaction";

export function buildCurrencyBridge(signerContext: SignerContext<CeloSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    getPreloadStrategy,
    preload,
    hydrate,
    scanAccounts,
  };
}

type CeloAccountBridge = AccountBridge<Transaction, CeloAccount>;

export function buildAccountBridge(signerContext: SignerContext<CeloSigner>): CeloAccountBridge {
  const getAddress = resolver(signerContext);

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
    getSerializedAddressParameters,
    assignFromAccountRaw,
    assignToAccountRaw,
    toOperationExtraRaw,
    fromOperationExtraRaw,
  };
}

export type CeloBridge = Bridge<Transaction, TransactionRaw, CeloAccount>;

export function createBridges(signerContext: SignerContext<CeloSigner>): CeloBridge {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    serializationBridge: serialization,
  };
}
