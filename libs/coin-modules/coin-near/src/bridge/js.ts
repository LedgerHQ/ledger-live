import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { NearCoinConfig, setCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { getPreloadStrategy, hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { NearSigner } from "../signer";
import { buildSignOperation } from "../signOperation";
import { getAccountShape, sync } from "../synchronisation";
import { serialization } from "../transaction";
import type { NearAccount, Transaction, TransactionRaw, TransactionStatus } from "../types";

export function buildCurrencyBridge(signerContext: SignerContext<NearSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload,
    hydrate,
    getPreloadStrategy,
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<NearSigner>,
): AccountBridge<Transaction, NearAccount, TransactionStatus, TransactionRaw> {
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
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    ...serialization,
  };
}

export function createBridges(
  signerContext: SignerContext<NearSigner>,
  coinConfig: NearCoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
