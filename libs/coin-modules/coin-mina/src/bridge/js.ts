import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  defaultUpdateTransaction,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { Transaction } from "../types";
import resolver from "../hw-getAddress";
import { sync, getAccountShape } from "../js-synchronisation";
import { createTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import { buildSignOperation } from "../js-signOperation";
import broadcast from "../js-broadcast";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { MinaSigner } from "../signer";
import { MinaCoinConfig, setCoinConfig } from "../config";

export function buildCurrencyBridge(signerContext: SignerContext<MinaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<MinaSigner>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
  };
}

export function createBridges(
  signerContext: SignerContext<MinaSigner>,
  coinConfig: MinaCoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
