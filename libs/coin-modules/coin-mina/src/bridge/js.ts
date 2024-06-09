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
import { sync, getAccountShape } from "../synchronisation";
import { MinaSigner } from "../signer";
import { MinaCoinConfig, setCoinConfig } from "../config";
import broadcast from "../broadcast";
import { createTransaction } from "../createTransaction";
import estimateMaxSpendable from "../estimateMaxSpendable";
import getTransactionStatus from "../getTransactionStatus";
import { prepareTransaction } from "../prepareTransaction";
import buildSignOperation from "../signOperation";

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
